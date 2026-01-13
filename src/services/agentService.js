// src/services/agentService.js
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

// Get agent dashboard statistics
export const getAgentStats = async (agentId) => {
    try {
        const commissionsRef = collection(db, "commissions");
        const q = query(commissionsRef, where("agentId", "==", agentId));
        const snapshot = await getDocs(q);

        let totalCommissions = 0;
        let thisMonthCommissions = 0;
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        snapshot.forEach(doc => {
            const data = doc.data();
            totalCommissions += data.agentCommission || 0;
            const createdAt = data.createdAt?.toDate();
            if (createdAt && createdAt >= monthStart) {
                thisMonthCommissions += data.agentCommission || 0;
            }
        });

        // Get referral count
        const usersRef = collection(db, "users");
        const refQ = query(usersRef, where("referredBy", "==", agentId));
        const refSnapshot = await getDocs(refQ);

        // Get commission balance from wallet
        const walletRef = doc(db, "wallets", agentId);
        const walletSnap = await getDoc(walletRef);
        const commissionBalance = walletSnap.data()?.commissionBalance || 0;

        return {
            totalReferrals: refSnapshot.size,
            totalCommissions,
            thisMonthCommissions,
            commissionBalance
        };
    } catch (error) {
        console.error("Error fetching agent stats:", error);
        throw error;
    }
};

// Get list of referred users
export const getReferredUsers = async (agentId) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("referredBy", "==", agentId));
        const snapshot = await getDocs(q);

        // Fetch wallet data for each user
        const usersWithBalances = await Promise.all(
            snapshot.docs.map(async (userDoc) => {
                const userData = {
                    id: userDoc.id,
                    ...userDoc.data(),
                    createdAt: userDoc.data().createdAt?.toDate()
                };

                // Fetch wallet balance
                try {
                    const walletRef = doc(db, "wallets", userDoc.id);
                    const walletSnap = await getDoc(walletRef);

                    if (walletSnap.exists()) {
                        const walletData = walletSnap.data();
                        // Calculate total balance
                        const totalBalance =
                            (walletData.mainBalance || 0) +
                            (walletData.spotBalance || 0) +
                            (walletData.tradingBalance || 0) +
                            (walletData.earnBalance || 0) +
                            (walletData.contractBalance || 0) +
                            (walletData.fiatBalance || 0) +
                            (walletData.commissionBalance || 0);

                        userData.balance = totalBalance;
                    } else {
                        userData.balance = 0;
                    }
                } catch (walletError) {
                    console.error(`Error fetching wallet for user ${userDoc.id}:`, walletError);
                    userData.balance = 0;
                }

                return userData;
            })
        );

        return usersWithBalances;
    } catch (error) {
        console.error("Error fetching referred users:", error);
        throw error;
    }
};

// Get commission history
export const getCommissionHistory = async (agentId) => {
    try {
        const commissionsRef = collection(db, "commissions");
        const q = query(
            commissionsRef,
            where("agentId", "==", agentId)
        );
        const snapshot = await getDocs(q);

        const commissions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
        }));

        // Sort by date descending and limit to 50
        return commissions
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 50);
    } catch (error) {
        console.error("Error fetching commission history:", error);
        throw error;
    }
};

// Helper to generate random code locally to avoid permission issues with global uniqueness check
const generateLocalReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Get agent's referral code (auto-generate if missing)
export const getAgentReferralCode = async (agentId) => {
    try {
        const userRef = doc(db, "users", agentId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error("Agent not found");
        }

        const data = userSnap.data();

        // If code exists, return it
        if (data.referralCode) {
            return data.referralCode;
        }

        // If no code, check if they are actually an agent
        if (data.role === 'agent') {
            console.log("Agent missing referral code, generating one...");
            // Generate locally to avoid "Permission Denied" on global uniqueness check
            const newCode = generateLocalReferralCode();

            await updateDoc(userRef, { referralCode: newCode });

            return newCode;
        }

        return null;
    } catch (error) {
        console.error("Error fetching referral code:", error);
        throw error;
    }
};

// Generate referral link
export const generateReferralLink = (referralCode) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${referralCode}`;
};

// Get list of sub-agents (users referred by this agent who are also agents)
export const getSubAgents = async (agentId) => {
    try {
        const usersRef = collection(db, "users");
        // Query for users referred by this agent AND have role 'agent'
        const q = query(
            usersRef,
            where("referredBy", "==", agentId),
            where("role", "==", "agent")
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
        }));
    } catch (error) {
        console.error("Error fetching sub-agents:", error);
        throw error;
    }
};

// Get orders from all users referred by the agent
export const getAgentDownlineOrders = async (agentId) => {
    try {
        // 1. First get all referred users
        const referredUsers = await getReferredUsers(agentId);
        const userIds = referredUsers.map(u => u.id);

        if (userIds.length === 0) return [];

        const tradesRef = collection(db, "trades");
        // Note: Ideally we filter by userIds, but 'in' query has limit 10.
        // For now fetching recent trades and filtering in memory.
        const q = query(tradesRef, orderBy("createdAt", "desc"), limit(200));
        const snapshot = await getDocs(q);

        const downlineTrades = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }))
            .filter(trade => userIds.includes(trade.uid));

        return downlineTrades;
    } catch (error) {
        console.error("Error fetching downline orders:", error);
        throw error;
    }
};

// Get deposits/withdrawals from all users referred by the agent
export const getAgentDownlineFinance = async (agentId, type = 'deposit') => {
    try {
        // 1. First get all referred users
        const referredUsers = await getReferredUsers(agentId);
        const userIds = referredUsers.map(u => u.id);

        if (userIds.length === 0) return [];

        const collectionName = type === 'deposit' ? 'deposits' : 'withdrawals';
        const financeRef = collection(db, collectionName);

        const q = query(financeRef, orderBy("createdAt", "desc"), limit(200));
        const snapshot = await getDocs(q);

        const downlineTransactions = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }))
            .filter(tx => userIds.includes(tx.uid));

        return downlineTransactions;

    } catch (error) {
        console.error(`Error fetching downline ${type}s:`, error);
        throw error;
    }
};

// Set trade control for a referred user
export const setReferredUserTradeControl = async (agentId, userId, tradeControl) => {
    try {
        // First verify the user is referred by this agent
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error("User not found");
        }

        const userData = userSnap.data();
        if (userData.referredBy !== agentId) {
            throw new Error("You can only manage users you have referred");
        }

        // Update trade control
        await updateDoc(userRef, {
            tradeControl: tradeControl
        });

        console.log(`Trade control updated for user ${userId}: ${tradeControl}`);
    } catch (error) {
        console.error("Error setting trade control:", error);
        throw error;
    }
};

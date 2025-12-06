// src/services/agentService.js
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc } from "firebase/firestore";
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

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
        }));
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

// Generate referral link
export const generateReferralLink = (agentId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${agentId}`;
};


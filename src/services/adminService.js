// src/services/adminService.js
import { db } from "../firebase";
import {
    collection,
    query,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    setDoc,
    addDoc,
    where,
    orderBy,
    limit
} from "firebase/firestore";

// Get all users
export const getAllUsers = async (filters = {}) => {
    try {
        const usersRef = collection(db, "users");
        let q = query(usersRef);

        if (filters.role) {
            q = query(usersRef, where("role", "==", filters.role));
        }

        const snapshot = await getDocs(q);
        const users = [];

        for (const userDoc of snapshot.docs) {
            const userData = userDoc.data();

            // Get wallet balance
            const walletDoc = await getDocs(query(collection(db, "wallets"), where("uid", "==", userDoc.id)));
            const walletData = walletDoc.docs[0]?.data();

            users.push({
                id: userDoc.id,
                ...userData,
                balance: walletData?.balance || 0,
                commissionBalance: walletData?.commissionBalance || 0,
                createdAt: userData.createdAt?.toDate()
            });
        }

        return users;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

// Set user balance
export const setUserBalance = async (userId, amount, operation = "set") => {
    try {
        const walletRef = doc(db, "wallets", userId);
        const walletSnap = await getDoc(walletRef);

        if (!walletSnap.exists()) {
            // Create wallet if it doesn't exist
            await setDoc(walletRef, {
                uid: userId,
                balance: operation === "set" ? amount : 0,
                commissionBalance: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return { success: true };
        }

        const currentBalance = walletSnap.data().balance || 0;

        if (operation === "set") {
            await updateDoc(walletRef, {
                balance: amount,
                updatedAt: new Date()
            });
        } else if (operation === "add") {
            await updateDoc(walletRef, {
                balance: currentBalance + amount,
                updatedAt: new Date()
            });
        } else if (operation === "subtract") {
            await updateDoc(walletRef, {
                balance: Math.max(0, currentBalance - amount),
                updatedAt: new Date()
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error setting balance:", error);
        throw error;
    }
};

// Freeze/Unfreeze user
export const freezeUser = async (userId, freeze = true) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            frozen: freeze,
            updatedAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error("Error freezing user:", error);
        throw error;
    }
};

// Create agent (upgrade user to agent role)
export const createAgent = async (userId) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            role: "agent",
            updatedAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error("Error creating agent:", error);
        throw error;
    }
};

// Get all deposits
export const getAllDeposits = async (status = null) => {
    try {
        const depositsRef = collection(db, "deposits");
        let q = query(depositsRef, orderBy("createdAt", "desc"));

        if (status) {
            q = query(depositsRef, where("status", "==", status), orderBy("createdAt", "desc"));
        }

        const snapshot = await getDocs(q);
        const deposits = [];

        for (const depositDoc of snapshot.docs) {
            const depositData = depositDoc.data();

            // Fetch user details
            let userName = null;
            let userEmail = null;

            if (depositData.uid) {
                try {
                    const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", depositData.uid)));
                    if (!userDoc.empty) {
                        const userData = userDoc.docs[0].data();
                        userName = userData.name;
                        userEmail = userData.email;
                    }
                } catch (err) {
                    console.error("Error fetching user for deposit:", err);
                }
            }

            deposits.push({
                id: depositDoc.id,
                ...depositData,
                userName,
                userEmail,
                createdAt: depositData.createdAt?.toDate(),
                processedAt: depositData.processedAt?.toDate()
            });
        }

        return deposits;
    } catch (error) {
        console.error("Error fetching deposits:", error);
        throw error;
    }
};

// Approve deposit
export const approveDeposit = async (depositId) => {
    try {
        const depositRef = doc(db, "deposits", depositId);
        const depositSnap = await getDoc(depositRef);

        if (!depositSnap.exists()) {
            throw new Error("Deposit not found");
        }

        const depositData = depositSnap.data();
        const { uid, amount } = depositData;
        const depositAmount = parseFloat(amount);

        if (isNaN(depositAmount)) {
            throw new Error("Invalid deposit amount");
        }

        // Update user's wallet balance
        const walletRef = doc(db, "wallets", uid);
        const walletSnap = await getDoc(walletRef);

        if (!walletSnap.exists()) {
            // Create wallet if it doesn't exist
            await setDoc(walletRef, {
                balance: depositAmount,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } else {
            const currentBalance = parseFloat(walletSnap.data().balance) || 0;
            await updateDoc(walletRef, {
                balance: currentBalance + depositAmount,
                updatedAt: new Date()
            });
        }

        // Check for referrer and handle commission
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        if (userData && userData.referredBy) {
            const referredBy = userData.referredBy;

            // Commission Split (Total 100% of deposit):
            // Platform: 10%
            // Agent: 40%
            // Admin: 50%
            const platformFee = depositAmount * 0.10;      // 10% on deposit
            const platformProfit = depositAmount * 0.50;   // 50% on deposit
            const agentCommission = depositAmount * 0.40;  // 40% on deposit

            // Create commission record
            await addDoc(collection(db, "commissions"), {
                agentId: referredBy,
                userId: uid,
                depositId: depositId,
                depositAmount: depositAmount,
                platformFee,
                agentCommission,
                platformProfit,
                status: "approved",
                createdAt: new Date()
            });

            // Add commission to agent's commission balance
            const agentWalletRef = doc(db, "wallets", referredBy);
            const agentWalletSnap = await getDoc(agentWalletRef);

            if (agentWalletSnap.exists()) {
                const currentCommissionBalance = agentWalletSnap.data().commissionBalance || 0;
                await updateDoc(agentWalletRef, {
                    commissionBalance: currentCommissionBalance + agentCommission,
                    updatedAt: new Date()
                });
            } else {
                // Create wallet for agent if doesn't exist
                await setDoc(agentWalletRef, {
                    balance: 0,
                    commissionBalance: agentCommission,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        // Update deposit status
        await updateDoc(depositRef, {
            status: "approved",
            processedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error("Error approving deposit:", error);
        throw error;
    }
};

// Reject deposit
export const rejectDeposit = async (depositId, reason) => {
    try {
        const depositRef = doc(db, "deposits", depositId);
        await updateDoc(depositRef, {
            status: "rejected",
            rejectionReason: reason,
            processedAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error("Error rejecting deposit:", error);
        throw error;
    }
};

// Get all withdrawals
export const getAllWithdrawals = async (status = null) => {
    try {
        const withdrawalsRef = collection(db, "withdrawals");
        let q = query(withdrawalsRef, orderBy("createdAt", "desc"));

        if (status) {
            q = query(withdrawalsRef, where("status", "==", status), orderBy("createdAt", "desc"));
        }

        const snapshot = await getDocs(q);
        const withdrawals = [];

        for (const withdrawalDoc of snapshot.docs) {
            const withdrawalData = withdrawalDoc.data();

            // Fetch user details
            let userName = null;
            let userEmail = null;

            if (withdrawalData.uid) {
                try {
                    const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", withdrawalData.uid)));
                    if (!userDoc.empty) {
                        const userData = userDoc.docs[0].data();
                        userName = userData.name;
                        userEmail = userData.email;
                    }
                } catch (err) {
                    console.error("Error fetching user for withdrawal:", err);
                }
            }

            withdrawals.push({
                id: withdrawalDoc.id,
                ...withdrawalData,
                userName,
                userEmail,
                createdAt: withdrawalData.createdAt?.toDate(),
                processedAt: withdrawalData.processedAt?.toDate()
            });
        }

        return withdrawals;
    } catch (error) {
        console.error("Error fetching withdrawals:", error);
        throw error;
    }
};

// Approve withdrawal
export const approveWithdrawal = async (withdrawalId) => {
    try {
        const withdrawalRef = doc(db, "withdrawals", withdrawalId);
        const withdrawalSnap = await getDoc(withdrawalRef);

        if (!withdrawalSnap.exists()) {
            throw new Error("Withdrawal not found");
        }

        const withdrawalData = withdrawalSnap.data();
        const { uid, amount, agentId } = withdrawalData;
        const withdrawalAmount = parseFloat(amount);

        if (isNaN(withdrawalAmount)) {
            throw new Error("Invalid withdrawal amount");
        }

        // Determine which balance to deduct from (User balance or Agent commission)
        const targetUid = uid || agentId;
        const balanceField = uid ? "balance" : "commissionBalance";

        if (!targetUid) {
            throw new Error("User ID or Agent ID missing from withdrawal record");
        }

        // Update wallet balance
        const walletRef = doc(db, "wallets", targetUid);
        const walletSnap = await getDoc(walletRef);

        if (!walletSnap.exists()) {
            throw new Error("Wallet not found for the user");
        }

        const currentBalance = parseFloat(walletSnap.data()[balanceField]) || 0;

        if (currentBalance < withdrawalAmount) {
            // This shouldn't happen if validation was done at request, but safety first
            console.warn(`Insufficient ${balanceField} for withdrawal ${withdrawalId}. Current: ${currentBalance}, Request: ${withdrawalAmount}`);
        }

        await updateDoc(walletRef, {
            [balanceField]: Math.max(0, currentBalance - withdrawalAmount),
            updatedAt: new Date()
        });

        // Update withdrawal status
        await updateDoc(withdrawalRef, {
            status: "approved",
            processedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error("Error approving withdrawal:", error);
        throw error;
    }
};

// Reject withdrawal
export const rejectWithdrawal = async (withdrawalId, reason) => {
    try {
        const withdrawalRef = doc(db, "withdrawals", withdrawalId);
        await updateDoc(withdrawalRef, {
            status: "rejected",
            rejectionReason: reason,
            processedAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error("Error rejecting withdrawal:", error);
        throw error;
    }
};

// Get all trades
export const getAllTrades = async () => {
    try {
        const tradesRef = collection(db, "trades");
        const q = query(tradesRef, orderBy("createdAt", "desc"), limit(100));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            closedAt: doc.data().closedAt?.toDate()
        }));
    } catch (error) {
        console.error("Error fetching trades:", error);
        throw error;
    }
};

// Force trade result
export const forceTradeResult = async (tradeId, result, pnl) => {
    try {
        const tradeRef = doc(db, "trades", tradeId);
        await updateDoc(tradeRef, {
            status: "closed",
            result: result,
            pnl: pnl,
            closedAt: new Date(),
            forcedBy: "admin" // In production, use actual admin UID
        });
        return { success: true };
    } catch (error) {
        console.error("Error forcing trade result:", error);
        throw error;
    }
};

/**
 * Manually assign a user to an agent (for users who didn't use referral code)
 */
export const assignUserToAgent = async (userId, agentId) => {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error("User not found");
        }

        // Verify agent exists and has agent role
        const agentRef = doc(db, "users", agentId);
        const agentSnap = await getDoc(agentRef);

        if (!agentSnap.exists()) {
            throw new Error("Agent not found");
        }

        if (agentSnap.data().role !== "agent") {
            throw new Error("Selected user is not an agent");
        }

        // Update user document with referredBy field
        await updateDoc(userRef, {
            referredBy: agentId,
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error("Error assigning user to agent:", error);
        throw error;
    }
};

/**
 * Get all agents (for dropdown selection)
 */
export const getAllAgents = async () => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "==", "agent"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching agents:", error);
        throw error;
    }
};

/**
 * Recalculate commissions for all past approved deposits
 * This is useful for backfilling data or fixing missing commissions
 */
export const recalculateCommissions = async () => {
    try {
        console.log("Starting commission recalculation...");

        // 1. Get all approved deposits
        const depositsRef = collection(db, "deposits");
        const q = query(depositsRef, where("status", "==", "approved"));
        const depositSnap = await getDocs(q);

        console.log(`Found ${depositSnap.size} approved deposits`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const depositDoc of depositSnap.docs) {
            const deposit = depositDoc.data();
            const depositId = depositDoc.id;

            // 2. Check if commission already exists for this deposit
            const commRef = collection(db, "commissions");
            const commQ = query(commRef, where("depositId", "==", depositId));
            const commSnap = await getDocs(commQ);

            if (!commSnap.empty) {
                skippedCount++;
                continue; // Commission already exists
            }

            // 3. Get user to check for referrer
            if (!deposit.uid) continue;

            const userRef = doc(db, "users", deposit.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) continue;

            const userData = userSnap.data();

            if (userData.referredBy) {
                const amount = parseFloat(deposit.amount);
                if (isNaN(amount)) continue;

                const platformFee = amount * 0.10;       // Platform: 10%
                const platformProfit = amount * 0.50;   // Admin: 50%
                const agentCommission = amount * 0.40;  // Agent: 40%

                // 4. Create commission record
                await addDoc(collection(db, "commissions"), {
                    agentId: userData.referredBy,
                    userId: deposit.uid,
                    depositId: depositId,
                    depositAmount: amount,
                    platformFee,
                    agentCommission,
                    platformProfit,
                    status: "approved",
                    createdAt: deposit.createdAt || new Date(), // Use deposit date if available
                    recalculatedAt: new Date()
                });

                // 5. Update agent wallet
                const agentWalletRef = doc(db, "wallets", userData.referredBy);
                const agentWalletSnap = await getDoc(agentWalletRef);

                if (agentWalletSnap.exists()) {
                    const currentComm = parseFloat(agentWalletSnap.data().commissionBalance) || 0;
                    await updateDoc(agentWalletRef, {
                        commissionBalance: currentComm + agentCommission,
                        updatedAt: new Date()
                    });
                } else {
                    await setDoc(agentWalletRef, {
                        balance: 0,
                        commissionBalance: agentCommission,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }

                createdCount++;
            }
        }

        return { success: true, created: createdCount, skipped: skippedCount };
    } catch (error) {
        console.error("Error recalculating commissions:", error);
        throw error;
    }
};

/**
 * Get platform settings (including deposit addresses)
 */
export const getPlatformSettings = async () => {
    try {
        const settingsRef = doc(db, "settings", "platform");
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
            return settingsSnap.data();
        } else {
            // Default mock data if no settings exist yet
            return {
                depositAddresses: {
                    BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
                    ETH: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                    USDT: "TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS"
                },
                updatedAt: new Date()
            };
        }
    } catch (error) {
        console.error("Error fetching platform settings:", error);
        throw error;
    }
};

/**
 * Update platform settings
 */
export const updatePlatformSettings = async (settings) => {
    try {
        const settingsRef = doc(db, "settings", "platform");
        await setDoc(settingsRef, {
            ...settings,
            updatedAt: new Date()
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error("Error updating platform settings:", error);
        throw error;
    }
};

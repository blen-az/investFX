// src/services/adminService.js
import { httpsCallable } from "firebase/functions";
import { functions, db } from "../firebase";
import {
    collection,
    query,
    getDocs,
    doc,
    updateDoc,
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

        if (operation === "set") {
            await updateDoc(walletRef, {
                balance: amount,
                updatedAt: new Date()
            });
        } else if (operation === "add") {
            const walletDoc = await getDocs(query(collection(db, "wallets"), where("uid", "==", userId)));
            const currentBalance = walletDoc.docs[0]?.data()?.balance || 0;
            await updateDoc(walletRef, {
                balance: currentBalance + amount,
                updatedAt: new Date()
            });
        } else if (operation === "subtract") {
            const walletDoc = await getDocs(query(collection(db, "wallets"), where("uid", "==", userId)));
            const currentBalance = walletDoc.docs[0]?.data()?.balance || 0;
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

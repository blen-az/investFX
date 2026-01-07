// src/services/withdrawalService.js
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";

/**
 * Submit a withdrawal request (for regular users - crypto withdrawals)
 */
export const submitWithdrawal = async (uid, amount, asset, address) => {
    try {
        const withdrawalData = {
            uid,
            amount: parseFloat(amount),
            asset: asset || "BTC",
            address,
            status: "pending",
            createdAt: new Date(),
            processedAt: null
        };

        const docRef = await addDoc(collection(db, "withdrawals"), withdrawalData);

        return {
            success: true,
            withdrawalId: docRef.id
        };
    } catch (error) {
        console.error("Error submitting withdrawal:", error);
        throw error;
    }
};

/**
 * Request a withdrawal (for agents - commission withdrawals)
 */
export const requestWithdrawal = async (agentId, amount, paymentMethod, paymentDetails) => {
    try {
        // Validate inputs
        if (!agentId || !amount || !paymentMethod) {
            throw new Error("Missing required fields");
        }

        if (amount < 10) {
            throw new Error("Minimum withdrawal amount is $10");
        }

        if (amount > 10000) {
            throw new Error("Maximum withdrawal amount is $10,000");
        }

        // Check agent's commission balance
        const walletRef = doc(db, "wallets", agentId);
        const walletSnap = await getDoc(walletRef);

        if (!walletSnap.exists()) {
            throw new Error("Wallet not found");
        }

        const commissionBalance = walletSnap.data().commissionBalance || 0;

        if (amount > commissionBalance) {
            throw new Error(`Insufficient balance. Available: $${commissionBalance.toFixed(2)}`);
        }

        // Create withdrawal request
        const withdrawalRef = await addDoc(collection(db, "withdrawals"), {
            agentId,
            amount,
            status: "pending",
            paymentMethod,
            paymentDetails,
            requestedAt: new Date(),
            createdAt: new Date(), // Standardize for admin query
            processedAt: null,
            processedBy: null,
            notes: ""
        });

        return {
            success: true,
            withdrawalId: withdrawalRef.id,
            message: "Withdrawal request submitted successfully"
        };
    } catch (error) {
        console.error("Error requesting withdrawal:", error);
        throw error;
    }
};

/**
 * Get withdrawal history for an agent
 */
export const getWithdrawalHistory = async (agentId) => {
    try {
        const withdrawalsRef = collection(db, "withdrawals");
        const q = query(
            withdrawalsRef,
            where("agentId", "==", agentId),
            orderBy("requestedAt", "desc")
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            requestedAt: doc.data().requestedAt?.toDate(),
            processedAt: doc.data().processedAt?.toDate()
        }));
    } catch (error) {
        console.error("Error fetching withdrawal history:", error);
        throw error;
    }
};

/**
 * Get withdrawal statistics
 */
export const getWithdrawalStats = async (agentId) => {
    try {
        const history = await getWithdrawalHistory(agentId);

        const totalWithdrawn = history
            .filter(w => w.status === "completed")
            .reduce((sum, w) => sum + w.amount, 0);

        const pendingWithdrawals = history
            .filter(w => w.status === "pending")
            .reduce((sum, w) => sum + w.amount, 0);

        const thisMonthWithdrawn = history
            .filter(w => {
                if (w.status !== "completed" || !w.processedAt) return false;
                const now = new Date();
                return w.processedAt.getMonth() === now.getMonth() &&
                    w.processedAt.getFullYear() === now.getFullYear();
            })
            .reduce((sum, w) => sum + w.amount, 0);

        return {
            totalWithdrawn,
            pendingWithdrawals,
            thisMonthWithdrawn,
            totalRequests: history.length,
            pendingCount: history.filter(w => w.status === "pending").length
        };
    } catch (error) {
        console.error("Error fetching withdrawal stats:", error);
        throw error;
    }
};

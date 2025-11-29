// src/services/withdrawalService.js
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

/**
 * Submit a withdrawal request
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

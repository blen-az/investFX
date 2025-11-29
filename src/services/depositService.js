// src/services/depositService.js
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

/**
 * Submit a deposit request
 */
export const submitDeposit = async (uid, amount, asset, proofFileName) => {
    try {
        const depositData = {
            uid,
            amount: parseFloat(amount),
            asset: asset || "BTC",
            method: "Crypto Transfer",
            transactionId: proofFileName, // Using filename as transaction reference
            status: "pending",
            createdAt: new Date(),
            processedAt: null
        };

        const docRef = await addDoc(collection(db, "deposits"), depositData);

        return {
            success: true,
            depositId: docRef.id
        };
    } catch (error) {
        console.error("Error submitting deposit:", error);
        throw error;
    }
};

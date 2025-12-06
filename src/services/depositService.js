// src/services/depositService.js
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

/**
 * Submit a deposit request
 */
export const submitDeposit = async (uid, amount, asset, proofFile) => {
    try {
        let proofUrl = null;

        // Upload proof file to Cloudinary if provided
        if (proofFile) {
            const formData = new FormData();
            formData.append("file", proofFile);
            formData.append("upload_preset", "invest"); // Your Unsigned Upload Preset
            formData.append("cloud_name", "dlzvewiff"); // Your Cloud Name

            const response = await fetch(
                "https://api.cloudinary.com/v1_1/dlzvewiff/image/upload",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Cloudinary upload failed: ${errorData.error?.message || "Unknown error"}`);
            }

            const data = await response.json();
            proofUrl = data.secure_url; // Get the URL from Cloudinary
        }

        const depositData = {
            uid,
            amount: parseFloat(amount),
            asset: asset || "BTC",
            method: "Crypto Transfer",
            transactionId: proofFile ? proofFile.name : "No Proof", // Keep filename as reference
            proofUrl: proofUrl, // Save the Cloudinary URL
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

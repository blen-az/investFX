// src/services/authService.js
import { db } from "../firebase";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    orderBy,
    limit
} from "firebase/firestore";

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to user via Firestore trigger email
 */
export const sendOTP = async (uid, email, name) => {
    try {
        const code = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes expiry

        // 1. Store the code for verification
        // First delete any existing codes for this user to avoid confusion
        const existingCodesQuery = query(
            collection(db, "verificationCodes"),
            where("uid", "==", uid)
        );
        const existingDocs = await getDocs(existingCodesQuery);
        for (const codeDoc of existingDocs.docs) {
            await deleteDoc(doc(db, "verificationCodes", codeDoc.id));
        }

        await addDoc(collection(db, "verificationCodes"), {
            uid,
            email,
            code,
            expiresAt,
            createdAt: serverTimestamp()
        });

        // 2. Trigger the email via Google Apps Script (Free method)
        // Set this URL after deploying your Google Apps Script
        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMdKzQM7Pi6SaCuOoccTiNB7m4UUIS2ZLuum8UvjpHIIxGCZncKfCkdu93v3_fdHSgIQ/exec";

        if (GOOGLE_SCRIPT_URL !== "YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE") {
            try {
                await fetch(GOOGLE_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors", // Required for Google Apps Script
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        name,
                        code
                    }),
                });
            } catch (err) {
                console.warn("GAS Email trigger failed (this is normal with no-cors):", err);
            }
        } else {
            console.warn("Google Script URL not set. Email not sent.");
        }

        return { success: true, expiresAt };
    } catch (error) {
        console.error("Error sending OTP:", error);
        throw error;
    }
};

/**
 * Verify the OTP entered by user
 */
export const verifyOTP = async (uid, code) => {
    try {
        const q = query(
            collection(db, "verificationCodes"),
            where("uid", "==", uid),
            where("code", "==", code.trim()),
            orderBy("createdAt", "desc"),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, message: "Invalid verification code" };
        }

        const data = snapshot.docs[0].data();
        const now = new Date();
        const expiresAt = data.expiresAt.toDate();

        if (now > expiresAt) {
            return { success: false, message: "Verification code has expired" };
        }

        // Mark user as verified in their document
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            emailVerified: true,
            updatedAt: serverTimestamp()
        });

        // Clean up: delete the code
        await deleteDoc(doc(db, "verificationCodes", snapshot.docs[0].id));

        return { success: true };
    } catch (error) {
        console.error("Error verifying OTP:", error);
        throw error;
    }
};

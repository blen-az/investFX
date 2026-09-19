// src/services/tradeService.js
import { db } from "../firebase";
import { doc, collection, runTransaction, serverTimestamp } from "firebase/firestore";
import { determineTradeOutcome } from "./tradeSettingsService";

/**
 * Open a new trade - deducts investment from user trading balance (or demoBalance if demo mode)
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
            const isDemo = Boolean(tradeData.isDemo);

            if (isDemo) {
                const demoBalance = walletData.demoBalance !== undefined ? parseFloat(walletData.demoBalance) : 10000;
                if (demoBalance < tradeData.amount) {
                    throw new Error("Insufficient demo balance. Click 'Reset Demo Funds' to restore your $10,000 practice balance.");
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
                    isDemo: true,
                    createdAt: serverTimestamp(),
                };

                // Only Delivery trades have an expiration
                if (tradeData.type === 'delivery') {
                    tradeRecord.expiresAt = new Date(Date.now() + parseDuration(tradeData.duration) * 1000);
                }

                // Calculate Liquidation Price for Perpetual
                if (tradeData.type === 'perpetual') {
                    const buffer = 0.9; // Liquidate when 90% of margin is lost
                    if (tradeData.side === 'buy') {
                        tradeRecord.liquidationPrice = tradeData.entryPrice * (1 - (buffer / (tradeData.leverage || 1)));
                    } else {
                        tradeRecord.liquidationPrice = tradeData.entryPrice * (1 + (buffer / (tradeData.leverage || 1)));
                    }
                }

                const tradeRef = doc(collection(db, "trades"));
                transaction.set(tradeRef, tradeRecord);

                // Deduct investment from demo balance
                transaction.update(walletRef, {
                    demoBalance: demoBalance - tradeData.amount,
                    updatedAt: serverTimestamp()
                });

                return {
                    success: true,
                    tradeId: tradeRef.id,
                    newDemoBalance: demoBalance - tradeData.amount,
                    isDemo: true
                };
            }

            // Real Trade Execution
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
                isDemo: false,
                createdAt: serverTimestamp(),
            };

            // Only Delivery trades have an expiration
            if (tradeData.type === 'delivery') {
                tradeRecord.expiresAt = new Date(Date.now() + parseDuration(tradeData.duration) * 1000);
            }

            // Calculate Liquidation Price for Perpetual
            if (tradeData.type === 'perpetual') {
                const buffer = 0.9; // Liquidate when 90% of margin is lost
                if (tradeData.side === 'buy') {
                    tradeRecord.liquidationPrice = tradeData.entryPrice * (1 - (buffer / (tradeData.leverage || 1)));
                } else {
                    tradeRecord.liquidationPrice = tradeData.entryPrice * (1 + (buffer / (tradeData.leverage || 1)));
                }
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
                newTradingBalance: tradingBalance - tradeData.amount,
                isDemo: false
            };
        });
    } catch (error) {
        console.error("Error opening trade:", error);
        throw error;
    }
};

/**
 * Close a trade - adds profit/loss to user trading balance (or demoBalance if demo mode)
 */
export const closeTrade = async (tradeId, uid, side, entryPrice, currentPrice, amount, profitPercent, type = 'delivery', leverage = 1) => {
    try {
        // Determine outcome based on settings
        const outcome = await determineTradeOutcome(uid, side, entryPrice, currentPrice, type);

        let pnl;
        let finalExitPrice = currentPrice;

        if (type === 'perpetual') {
            // Leverage based P&L: ((Current - Entry) / Entry) * Amount * Leverage
            const priceDeltaPercent = (currentPrice - entryPrice) / entryPrice;
            pnl = priceDeltaPercent * amount * leverage * (side === "buy" ? 1 : -1);

            // Admin Override Handling
            if (outcome === "win" && pnl <= 0) {
                pnl = Math.abs(pnl) || (amount * 0.1); // Force positive if admin says win
                // Reverse calculate the exit price so the math perfectly matches the forced PNL!
                finalExitPrice = entryPrice * (1 + (pnl / (amount * leverage * (side === "buy" ? 1 : -1))));
            }
            if (outcome === "loss" && pnl >= 0) {
                pnl = -Math.abs(pnl) || -(amount * 0.1); // Force negative if admin says loss
                // Reverse calculate the exit price so the math perfectly matches the forced PNL!
                finalExitPrice = entryPrice * (1 + (pnl / (amount * leverage * (side === "buy" ? 1 : -1))));
            }
        } else {
            // Binary (Delivery) logic
            pnl = outcome === "win"
                ? amount * (profitPercent / 100)
                : -amount;
                
            // Admin Override Handling for Binary Options (Delivery)
            const jitterRatio = 0.0004 + Math.random() * 0.0006; // 0.04% - 0.10% realistic tick
            if (outcome === "win") {
                if (side === "buy" && finalExitPrice <= entryPrice) {
                    finalExitPrice = entryPrice * (1 + jitterRatio);
                } else if (side === "sell" && finalExitPrice >= entryPrice) {
                    finalExitPrice = entryPrice * (1 - jitterRatio);
                }
            } else if (outcome === "loss") {
                if (side === "buy" && finalExitPrice >= entryPrice) {
                    finalExitPrice = entryPrice * (1 - jitterRatio);
                } else if (side === "sell" && finalExitPrice <= entryPrice) {
                    finalExitPrice = entryPrice * (1 + jitterRatio);
                }
            }

            // Guaranteed safeguard: closing price must never equal opening price
            if (finalExitPrice === entryPrice) {
                finalExitPrice = outcome === "win"
                    ? (side === "buy" ? entryPrice * (1 + jitterRatio) : entryPrice * (1 - jitterRatio))
                    : (side === "buy" ? entryPrice * (1 - jitterRatio) : entryPrice * (1 + jitterRatio));
            }
        }

        return await runTransaction(db, async (transaction) => {
            // 1. Get Trade Doc inside transaction to ensure atomicity
            const tradeRef = doc(db, "trades", tradeId);
            const tradeSnap = await transaction.get(tradeRef);

            if (!tradeSnap.exists()) {
                throw new Error("Trade not found");
            }

            const tradeData = tradeSnap.data();

            // Check if trade is already closed
            if (tradeData.status !== "active") {
                console.warn(`Trade ${tradeId} is already closed. Skipping payout.`);
                return {
                    success: false,
                    reason: "Trade already closed",
                    outcome: tradeData.result,
                    pnl: tradeData.pnl,
                    exitPrice: tradeData.exitPrice || finalExitPrice,
                    newBalance: null
                };
            }

            const walletRef = doc(db, "wallets", uid);
            const walletSnap = await transaction.get(walletRef);

            if (!walletSnap.exists()) {
                throw new Error("Wallet not found");
            }

            const walletData = walletSnap.data();
            const isDemo = tradeData.isDemo === true;

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

            if (isDemo) {
                const currentDemoBalance = walletData.demoBalance !== undefined ? parseFloat(walletData.demoBalance) : 10000;
                const newDemoBalance = currentDemoBalance + finalReturn;

                transaction.update(walletRef, {
                    demoBalance: newDemoBalance,
                    updatedAt: serverTimestamp()
                });

                // Update trade record
                transaction.update(tradeRef, {
                    status: "closed",
                    result: type === 'perpetual' ? (pnl >= 0 ? "win" : "loss") : outcome,
                    pnl,
                    exitPrice: finalExitPrice,
                    closedAt: serverTimestamp()
                });

                return {
                    success: true,
                    outcome: type === 'perpetual' ? (pnl >= 0 ? "win" : "loss") : outcome,
                    pnl,
                    exitPrice: finalExitPrice,
                    newBalance: newDemoBalance,
                    isDemo: true
                };
            } else {
                const tradingBalance = parseFloat(walletData.tradingBalance) || 0;
                const newBalance = tradingBalance + finalReturn;

                transaction.update(walletRef, {
                    tradingBalance: newBalance,
                    updatedAt: serverTimestamp()
                });

                // Update trade record
                transaction.update(tradeRef, {
                    status: "closed",
                    result: type === 'perpetual' ? (pnl >= 0 ? "win" : "loss") : outcome,
                    pnl,
                    exitPrice: finalExitPrice,
                    closedAt: serverTimestamp()
                });

                return {
                    success: true,
                    outcome: type === 'perpetual' ? (pnl >= 0 ? "win" : "loss") : outcome,
                    pnl,
                    exitPrice: finalExitPrice,
                    newTradingBalance: newBalance,
                    isDemo: false
                };
            }
        });
    } catch (error) {
        console.error("Error closing trade:", error);
        throw error;
    }
};

/**
 * Reset User's Demo Balance back to $10,000 (or custom amount)
 */
export const resetDemoBalance = async (uid, amount = 10000) => {
    try {
        const walletRef = doc(db, "wallets", uid);
        return await runTransaction(db, async (transaction) => {
            const walletSnap = await transaction.get(walletRef);
            if (!walletSnap.exists()) {
                transaction.set(walletRef, {
                    uid,
                    demoBalance: amount,
                    tradingBalance: 0,
                    mainBalance: 0,
                    updatedAt: serverTimestamp()
                });
            } else {
                transaction.update(walletRef, {
                    demoBalance: amount,
                    updatedAt: serverTimestamp()
                });
            }
            return { success: true, demoBalance: amount };
        });
    } catch (error) {
        console.error("Error resetting demo balance:", error);
        throw error;
    }
};

/**
 * Automatically check and close trades that have reached expiration or liquidation
 * This is meant to be called in a heartbeat loop on the client side.
 */
export const checkAndAutoCloseTrades = async (uid, activeTrades, currentPrices) => {
    const results = [];
    const now = Date.now();

    for (const trade of activeTrades) {
        if (trade.uid !== uid || trade.status !== 'active') continue;

        let shouldClose = false;
        let reason = "";

        // 1. Check Delivery Expiration
        if (trade.type === 'delivery' && trade.expiresAt) {
            if (now >= trade.expiresAt.getTime()) {
                shouldClose = true;
                reason = "expiration";
            }
        }

        // 2. Check Perpetual Liquidation
        if (trade.type === 'perpetual' && trade.liquidationPrice) {
            const currentPrice = currentPrices[trade.asset];
            if (currentPrice) {
                const isLiquidated = trade.side === 'buy'
                    ? currentPrice <= trade.liquidationPrice
                    : currentPrice >= trade.liquidationPrice;

                if (isLiquidated) {
                    shouldClose = true;
                    reason = "liquidation";
                }
            }
        }

        if (shouldClose) {
            try {
                const currentPrice = currentPrices[trade.asset] || trade.entryPrice;
                const result = await closeTrade(
                    trade.id,
                    uid,
                    trade.side,
                    trade.entryPrice,
                    currentPrice,
                    trade.amount,
                    trade.profitPercent,
                    trade.type,
                    trade.leverage
                );
                results.push({ tradeId: trade.id, success: true, reason, result });
            } catch (error) {
                console.error(`Failed to auto-close trade ${trade.id}:`, error);
                results.push({ tradeId: trade.id, success: false, error: error.message });
            }
        }
    }
    return results;
};

/**
 * Parse duration string to seconds
 */
function parseDuration(dur) {
    if (typeof dur === 'number') return dur;
    if (dur && typeof dur === 'string') {
        if (dur.endsWith("s")) return parseInt(dur);
        if (dur.endsWith("m")) return parseInt(dur) * 60;
    }
    return 60;
}

/* ================================================================
   GUEST DEMO TRADING HELPERS (No Sign-In Required)
   ================================================================ */

const GUEST_BALANCE_KEY = "investfx_guest_demo_balance";
const GUEST_TRADES_KEY = "investfx_guest_demo_trades";

export const getGuestDemoBalance = () => {
    try {
        const stored = localStorage.getItem(GUEST_BALANCE_KEY);
        if (stored !== null) {
            const parsed = parseFloat(stored);
            if (!isNaN(parsed)) return parsed;
        }
    } catch (e) {
        console.warn("Could not read guest demo balance from localStorage", e);
    }
    return 10000;
};

export const setGuestDemoBalance = (amount) => {
    try {
        localStorage.setItem(GUEST_BALANCE_KEY, amount.toString());
        window.dispatchEvent(new CustomEvent("investfx_guest_trade_update", { detail: { type: "balance", balance: amount } }));
    } catch (e) {
        console.warn("Could not write guest demo balance to localStorage", e);
    }
};

export const getGuestDemoTrades = () => {
    try {
        const stored = localStorage.getItem(GUEST_TRADES_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed.map(t => ({
                    ...t,
                    createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
                    expiresAt: t.expiresAt ? new Date(t.expiresAt) : null,
                    closedAt: t.closedAt ? new Date(t.closedAt) : null,
                }));
            }
        }
    } catch (e) {
        console.warn("Could not read guest demo trades", e);
    }
    return [];
};

const saveGuestDemoTrades = (trades) => {
    try {
        localStorage.setItem(GUEST_TRADES_KEY, JSON.stringify(trades));
        window.dispatchEvent(new CustomEvent("investfx_guest_trade_update", { detail: { type: "trades", trades } }));
    } catch (e) {
        console.warn("Could not save guest demo trades", e);
    }
};

export const resetGuestDemoBalance = () => {
    setGuestDemoBalance(10000);
    return 10000;
};

export const openGuestTrade = async (tradeData) => {
    const currentBalance = getGuestDemoBalance();
    if (currentBalance < tradeData.amount) {
        throw new Error("Insufficient demo balance. Click 'Reset Demo Funds' to restore your $10,000 practice balance.");
    }

    const durationSeconds = parseDuration(tradeData.duration);
    const now = new Date();
    const expiresAt = tradeData.type === 'delivery' ? new Date(now.getTime() + durationSeconds * 1000) : null;

    let liquidationPrice = null;
    if (tradeData.type === 'perpetual') {
        const buffer = 0.9;
        const lev = tradeData.leverage || 1;
        liquidationPrice = tradeData.side === 'buy'
            ? tradeData.entryPrice * (1 - (buffer / lev))
            : tradeData.entryPrice * (1 + (buffer / lev));
    }

    const tradeRecord = {
        id: "guest_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        uid: "guest",
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
        isDemo: true,
        liquidationPrice,
        createdAt: now.toISOString(),
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
    };

    const newBalance = currentBalance - tradeData.amount;
    setGuestDemoBalance(newBalance);

    const trades = getGuestDemoTrades();
    trades.unshift(tradeRecord);
    saveGuestDemoTrades(trades);

    return {
        success: true,
        tradeId: tradeRecord.id,
        newDemoBalance: newBalance,
        isDemo: true
    };
};

export const closeGuestTrade = async (tradeId, exitPriceOverride = null) => {
    const trades = getGuestDemoTrades();
    const tradeIndex = trades.findIndex(t => t.id === tradeId);
    if (tradeIndex === -1) {
        throw new Error("Guest trade not found");
    }

    const trade = trades[tradeIndex];
    if (trade.status === 'closed') {
        return trade;
    }

    const exitPrice = exitPriceOverride || trade.entryPrice;
    let outcome = "loss";
    let pnl = -trade.amount;

    if (trade.type === 'delivery') {
        const isWin = trade.side === 'buy'
            ? exitPrice > trade.entryPrice
            : exitPrice < trade.entryPrice;
        
        outcome = isWin ? "win" : "loss";
        pnl = isWin ? trade.amount * ((trade.profitPercent || 20) / 100) : -trade.amount;
    } else {
        // Perpetual
        const priceDiff = trade.side === 'buy' ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice;
        const pnlPct = (priceDiff / trade.entryPrice) * (trade.leverage || 1);
        pnl = trade.amount * pnlPct;
        outcome = pnl >= 0 ? "win" : "loss";
    }

    // Update guest balance
    const currentBalance = getGuestDemoBalance();
    const returnAmount = outcome === "win" ? trade.amount + pnl : (trade.type === 'perpetual' ? Math.max(0, trade.amount + pnl) : 0);
    const newBalance = currentBalance + returnAmount;
    setGuestDemoBalance(newBalance);

    const closedTrade = {
        ...trade,
        status: "closed",
        exitPrice,
        outcome,
        pnl,
        closedAt: new Date().toISOString()
    };

    trades[tradeIndex] = closedTrade;
    saveGuestDemoTrades(trades);

    return {
        success: true,
        tradeId,
        outcome,
        exitPrice,
        pnl,
        newDemoBalance: newBalance,
        isDemo: true
    };
};

export const checkAndAutoCloseGuestTrades = async (currentPrices) => {
    const trades = getGuestDemoTrades();
    const active = trades.filter(t => t.status === "active");
    if (active.length === 0) return [];

    const results = [];
    const now = new Date();

    for (const trade of active) {
        let shouldClose = false;
        let reason = "expired";

        if (trade.type === 'delivery' && trade.expiresAt) {
            if (new Date(trade.expiresAt) <= now) {
                shouldClose = true;
                reason = "expired";
            }
        }

        if (trade.type === 'perpetual' && trade.liquidationPrice) {
            const currentPrice = currentPrices[trade.asset];
            if (currentPrice) {
                const isLiquidated = trade.side === 'buy'
                    ? currentPrice <= trade.liquidationPrice
                    : currentPrice >= trade.liquidationPrice;
                if (isLiquidated) {
                    shouldClose = true;
                    reason = "liquidation";
                }
            }
        }

        if (shouldClose) {
            try {
                let currentPrice = currentPrices[trade.asset] || trade.entryPrice;
                // Add minor jitter if exact match so clear win/loss can be visualized
                if (currentPrice === trade.entryPrice) {
                    const jitter = trade.entryPrice * (0.0004 + Math.random() * 0.0005);
                    currentPrice = trade.side === 'buy' ? trade.entryPrice + jitter : trade.entryPrice - jitter;
                }
                const result = await closeGuestTrade(trade.id, currentPrice);
                results.push({ tradeId: trade.id, success: true, reason, result });
            } catch (err) {
                console.error("Error auto-closing guest trade:", err);
            }
        }
    }

    return results;
};

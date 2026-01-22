// src/components/ActiveTradeModal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { determineTradeOutcome } from "../services/tradeSettingsService";
import { closeTrade } from "../services/tradeService";
import "./ActiveTradeModal.css";

export default function ActiveTradeModal({ trade, currentPrice, onClose }) {
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState(parseDuration(trade.duration));
    const [progress, setProgress] = useState(100);
    const [forcedOutcome, setForcedOutcome] = useState(null);
    const [tradeSettled, setTradeSettled] = useState(false);
    const [completionInfo, setCompletionInfo] = useState(null);

    const initialDuration = parseDuration(trade.duration);

    // Calculate P&L with admin override
    const calculatePnL = () => {
        // If trade expired and we have a forced outcome, use it
        if (timeLeft === 0 && forcedOutcome) {
            return forcedOutcome === "win"
                ? trade.amount * (trade.profitPercent / 100)
                : -trade.amount;
        }

        // Otherwise show live P&L based on price
        const isProfit = trade.side === "buy"
            ? currentPrice > trade.entryPrice
            : currentPrice < trade.entryPrice;

        return isProfit
            ? trade.amount * (trade.profitPercent / 100)
            : -trade.amount;
    };

    const pnl = calculatePnL();

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setProgress((timeLeft / initialDuration) * 100);

        // When trade expires, determine outcome and settle trade
        if (timeLeft === 0 && !tradeSettled && user?.uid && trade.tradeId) {
            setTradeSettled(true);

            // Close trade and update balance
            closeTrade(
                trade.tradeId,
                user.uid,
                trade.side,
                trade.entryPrice,
                currentPrice,
                trade.amount,
                trade.profitPercent,
                'delivery',
                1
            ).then(result => {
                setForcedOutcome(result.outcome);
                setCompletionInfo({
                    exitPrice: currentPrice,
                    closedAt: new Date(),
                    outcome: result.outcome,
                    pnl: result.pnl
                });
                console.log("Trade settled:", result);
            }).catch(err => {
                console.error("Error settling trade:", err);
                // Fallback: still determine outcome for display
                determineTradeOutcome(user.uid, trade.side, trade.entryPrice, currentPrice)
                    .then(outcome => {
                        setForcedOutcome(outcome);
                        setCompletionInfo({
                            exitPrice: currentPrice,
                            closedAt: new Date(),
                            outcome: outcome,
                            pnl: outcome === 'win' ? trade.amount * (trade.profitPercent / 100) : -trade.amount
                        });
                    })
                    .catch(e => console.error("Error determining outcome:", e));
            });
        }
    }, [timeLeft, initialDuration, tradeSettled, user, trade, currentPrice]);

    function parseDuration(dur) {
        if (dur.endsWith("s")) return parseInt(dur);
        if (dur.endsWith("m")) return parseInt(dur) * 60;
        return 60;
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const formatDateTime = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    return (
        <div className="active-trade-overlay">
            <div className="active-trade-modal">
                <div className="modal-header">
                    <div className="trade-info">
                        <span className="coin-icon-modal">₿</span>
                        <span className="trade-title">
                            {trade.side.toUpperCase()} {trade.coin.symbol.toUpperCase()}/USDT
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="status-bar">
                    <div className="status-indicator pulse"></div>
                    <span>Trade Active</span>
                </div>

                <div className="trade-grid-details">
                    <div className="detail-item">
                        <span className="label">Investment</span>
                        <span className="value">${trade.amount}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Entry Price</span>
                        <span className="value">${trade.entryPrice.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Current Price</span>
                        <span className="value">${currentPrice.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Potential Profit</span>
                        <span className="value positive">{trade.profitPercent}%</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">duration</span>
                        <span className="value">{initialDuration}</span>
                    </div>
                </div>

                <div className="live-pnl-section">
                    <div className="pnl-label">Live P&L</div>
                    <div className={`pnl-value ${pnl >= 0 ? "positive" : "negative"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                    </div>
                    <div className={`pnl-status ${pnl >= 0 ? "winning" : "losing"}`}>
                        {pnl >= 0 ? "Winning" : "Losing"}
                    </div>
                </div>

                <div className="timer-section">
                    <svg className="progress-ring" width="120" height="120">
                        <circle
                            className="progress-ring__circle-bg"
                            stroke="rgba(0,0,0,0.05)"
                            strokeWidth="8"
                            fill="transparent"
                            r="52"
                            cx="60"
                            cy="60"
                        />
                        <circle
                            className="progress-ring__circle"
                            stroke={pnl >= 0 ? "#10b981" : "#ef4444"}
                            strokeWidth="8"
                            fill="transparent"
                            r="52"
                            cx="60"
                            cy="60"
                            style={{
                                strokeDasharray: `${2 * Math.PI * 52} ${2 * Math.PI * 52}`,
                                strokeDashoffset: `${2 * Math.PI * 52 * (1 - progress / 100)}`,
                                transition: "stroke-dashoffset 1s linear"
                            }}
                        />
                    </svg>
                    <div className="timer-text">
                        <div className="time-value">{timeLeft} duration</div>
                        <div className="time-label">Remaining</div>
                    </div>
                </div>

                {completionInfo && (
                    <div className="completion-overlay">
                        <div className="completion-card detailed-view">
                            <div className="completion-header">
                                <span className="symbol-title">{trade.coin.symbol}/USDT</span>
                                <button className="close-icon-btn" onClick={onClose}>×</button>
                            </div>

                            <div className={`pnl-summary ${completionInfo.pnl >= 0 ? "positive" : "negative"}`}>
                                {completionInfo.pnl >= 0 ? "+" : ""}{completionInfo.pnl.toFixed(4)}
                            </div>

                            <div className="trade-details-list">
                                <div className="detail-row">
                                    <span className="detail-label">Trading direction</span>
                                    <span className={`detail-value ${trade.side === 'buy' ? 'up' : 'down'}`}>
                                        {trade.side === 'buy' ? 'Buy' : 'Sell'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Number</span>
                                    <span className="detail-value">{(trade.amount * (1 + (trade.profitPercent / 100))).toFixed(4)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Opening price</span>
                                    <span className="detail-value">{trade.entryPrice.toFixed(6)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Closed Price</span>
                                    <span className="detail-value">{completionInfo.exitPrice.toFixed(6)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">duration</span>
                                    <span className="detail-value">{initialDuration}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">profit rate</span>
                                    <span className="detail-value">{trade.profitPercent}%</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">P/L</span>
                                    <span className={`detail-value ${completionInfo.pnl >= 0 ? "positive" : "negative"}`}>
                                        {completionInfo.pnl >= 0 ? "+" : ""}{completionInfo.pnl.toFixed(4)}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">position opening time</span>
                                    <span className="detail-value">{formatDateTime(trade.startTime)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Close time</span>
                                    <span className="detail-value">{formatDateTime(completionInfo.closedAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

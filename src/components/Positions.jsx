import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { closeTrade } from "../services/tradeService";
import "./Positions.css";

export default function Positions({ currentPrice, currentCoin, initialTab = "active" }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(initialTab); // active | completed
    const [activeTrades, setActiveTrades] = useState([]);
    const [completedTrades, setCompletedTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [closingId, setClosingId] = useState(null);
    const [now, setNow] = useState(Date.now());

    // Update 'now' every second for the countdown
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!user) return;

        const tradesRef = collection(db, "trades");

        // Listener for Active Trades
        const activeQuery = query(
            tradesRef,
            where("uid", "==", user.uid),
            where("status", "==", "active"),
            orderBy("createdAt", "desc")
        );

        const unsubscribeActive = onSnapshot(activeQuery, (snapshot) => {
            const trades = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                expiresAt: doc.data().expiresAt?.toDate()
            }));
            setActiveTrades(trades);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching active trades:", error);
            setLoading(false);
        });

        // Listener for Completed Trades
        const completedQuery = query(
            tradesRef,
            where("uid", "==", user.uid),
            where("status", "==", "closed"),
            orderBy("closedAt", "desc")
        );

        const unsubscribeCompleted = onSnapshot(completedQuery, (snapshot) => {
            const trades = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                closedAt: doc.data().closedAt?.toDate()
            }));
            setCompletedTrades(trades);
        });

        return () => {
            if (unsubscribeActive) unsubscribeActive();
            if (unsubscribeCompleted) unsubscribeCompleted();
        };
    }, [user]);

    const handleClosePosition = async (trade) => {
        if (!user || closingId) return;

        try {
            setClosingId(trade.id);
            // If the coin matches, use livePrice, otherwise use current entryPrice as fallback
            const exitPrice = trade.asset === currentCoin ? currentPrice : trade.entryPrice;

            await closeTrade(
                trade.id,
                user.uid,
                trade.side,
                trade.entryPrice,
                exitPrice,
                trade.amount,
                trade.profitPercent,
                trade.type,
                trade.leverage
            );
        } catch (error) {
            console.error("Error closing position:", error);
            alert("Failed to close position: " + error.message);
        } finally {
            setClosingId(null);
        }
    };

    const getSymbolIcon = (asset) => {
        if (!asset) return "🪙";
        if (asset.includes("BTC")) return "₿";
        if (asset.includes("ETH")) return "Ξ";
        if (asset.includes("SOL")) return "S";
        if (asset.includes("XRP")) return "✕";
        if (asset.includes("ADA")) return "₳";
        if (asset.includes("DOGE")) return "Ð";
        if (asset.includes("DOT")) return "●";
        if (asset.includes("LTC")) return "Ł";
        if (asset.includes("LINK")) return "🔗";
        if (asset.includes("BNB")) return "🟡";
        return "🪙";
    };

    return (
        <div className="positions-container">
            {/* Tabs */}
            <div className="positions-tabs">
                <button
                    className={`pos-tab ${activeTab === "active" ? "active" : ""}`}
                    onClick={() => setActiveTab("active")}
                >
                    Active <span className="badge-count">{activeTrades.length}</span>
                </button>
                <button
                    className={`pos-tab ${activeTab === "completed" ? "completed" : ""}`}
                    onClick={() => setActiveTab("completed")}
                >
                    Completed <span className="badge-count success">{completedTrades.length}</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="positions-toolbar">
                <span className="last-updated">Real-time updates enabled</span>
            </div>

            {/* Content */}
            <div className="positions-content">
                {loading ? (
                    <div className="loading-state">Loading trades...</div>
                ) : activeTab === "active" ? (
                    <div className="trades-list">
                        {activeTrades.length === 0 ? (
                            <div className="empty-state-pos">No active trades</div>
                        ) : (
                            activeTrades.map((trade) => {
                                const totalTime = trade.expiresAt ? (trade.expiresAt.getTime() - trade.createdAt.getTime()) / 1000 : 60;
                                const timeLeft = trade.expiresAt ? Math.max(0, Math.floor((trade.expiresAt.getTime() - now) / 1000)) : 0;
                                const progress = (timeLeft / (totalTime || 1)) * 100;

                                // PnL Calculation for Perpetual
                                let pnl = 0;
                                let pnlPercent = 0;
                                if (trade.type === 'perpetual' && trade.asset === currentCoin) {
                                    const priceDeltaPercent = (currentPrice - trade.entryPrice) / trade.entryPrice;
                                    pnl = priceDeltaPercent * trade.amount * trade.leverage * (trade.side === "buy" ? 1 : -1);
                                    pnlPercent = priceDeltaPercent * trade.leverage * (trade.side === "buy" ? 1 : -1) * 100;
                                }

                                // Risk Level Calculation for Perpetual
                                let riskLevel = 0; // 0 to 100
                                if (trade.type === 'perpetual' && trade.liquidationPrice && trade.asset === currentCoin) {
                                    const distToLiq = Math.abs(currentPrice - trade.liquidationPrice);
                                    const entryToLiq = Math.abs(trade.entryPrice - trade.liquidationPrice);
                                    riskLevel = Math.min(100, Math.max(0, (1 - (distToLiq / entryToLiq)) * 100));
                                }

                                return (
                                    <div key={trade.id} className={`trade-row ${trade.type}`}>
                                        <div className="trade-row-header">
                                            <div className="trade-symbol">
                                                <span className="coin-icon">{getSymbolIcon(trade.asset)}</span>
                                                {trade.assetName} ({trade.asset})
                                                {trade.type === 'perpetual' && (
                                                    <span className="leverage-tag">{trade.leverage}x</span>
                                                )}
                                            </div>
                                            <div className={`trade-type ${trade.side}`}>
                                                {trade.side?.toUpperCase()}
                                            </div>
                                            <div className="trade-status-text active">
                                                {trade.type === 'perpetual' ? 'PERPETUAL' : 'ACTIVE'}
                                            </div>
                                        </div>

                                        <div className="trade-details-grid">
                                            <div className="detail-col">
                                                <span className="label">Amount:</span>
                                                <span className="value">${(trade.amount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="detail-col">
                                                <span className="label">Entry:</span>
                                                <span className="value">${(trade.entryPrice || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="detail-col">
                                                <span className="label">
                                                    {trade.type === 'perpetual' ? 'Real-time P&L:' : 'Take Profit:'}
                                                </span>
                                                <span className={`value ${trade.type === 'perpetual' ? (pnl >= 0 ? 'positive' : 'negative') : ''}`}>
                                                    {trade.type === 'perpetual'
                                                        ? `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`
                                                        : `+${trade.profitPercent}%`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar / Perpetual Info */}
                                        {trade.type === 'delivery' ? (
                                            <div className="trade-progress-container">
                                                <div className="progress-info">
                                                    <span>{timeLeft}s remaining</span>
                                                </div>
                                                <div className="progress-bar-bg">
                                                    <div
                                                        className="progress-bar-fill"
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="perpetual-info-container">
                                                <div className="perpetual-row">
                                                    <div className="liq-price-mini">
                                                        Liq. Price: <span className="warning">${(trade.liquidationPrice || (trade.entryPrice * (1 - (1 / trade.leverage) * 0.9))).toFixed(2)}</span>
                                                    </div>
                                                    <div className="risk-indicator">
                                                        Risk: <span className={`risk-value ${riskLevel > 70 ? 'critical' : riskLevel > 40 ? 'warning' : 'safe'}`}>{riskLevel.toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                                <div className="risk-bar-container">
                                                    <div className={`risk-bar-fill ${riskLevel > 70 ? 'critical' : riskLevel > 40 ? 'warning' : 'safe'}`} style={{ width: `${riskLevel}%` }}></div>
                                                </div>
                                                <button
                                                    className="close-pos-btn"
                                                    onClick={() => handleClosePosition(trade)}
                                                    disabled={closingId === trade.id}
                                                >
                                                    {closingId === trade.id ? 'Closing...' : 'Close Position'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="trades-list">
                        {completedTrades.length === 0 ? (
                            <div className="empty-state-pos">No completed trades</div>
                        ) : (
                            completedTrades.map((trade) => (
                                <div key={trade.id} className={`trade-row ${trade.result}`}>
                                    <div className="trade-row-header">
                                        <div className="trade-symbol">
                                            <span className="coin-icon">{getSymbolIcon(trade.asset)}</span>
                                            {trade.assetName}
                                        </div>
                                        <div className={`trade-status-text ${trade.result}`}>
                                            {trade.result?.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="trade-details-grid">
                                        <div className="detail-col">
                                            <span className="label">Amount:</span>
                                            <span className="value">${(trade.amount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="detail-col">
                                            <span className="label">Result:</span>
                                            <span className={`value ${trade.result === 'win' ? 'positive' : 'negative'}`}>
                                                {trade.result === 'win' ? '+' : ''}${Math.abs(trade.pnl || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="detail-col">
                                            <span className="label">Closed:</span>
                                            <span className="value" style={{ fontSize: '10px' }}>
                                                {trade.closedAt?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

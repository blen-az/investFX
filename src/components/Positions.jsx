import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import "./Positions.css";

export default function Positions() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("active"); // active | completed
    const [activeTrades, setActiveTrades] = useState([]);
    const [completedTrades, setCompletedTrades] = useState([]);
    const [loading, setLoading] = useState(true);
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

    const getSymbolIcon = (asset) => {
        if (asset?.includes("BTC")) return "₿";
        if (asset?.includes("ETH")) return "Ξ";
        if (asset?.includes("SOL")) return "S";
        return "₿";
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

                                return (
                                    <div key={trade.id} className="trade-row">
                                        <div className="trade-row-header">
                                            <div className="trade-symbol">
                                                <span className="coin-icon">{getSymbolIcon(trade.asset)}</span>
                                                {trade.assetName} ({trade.asset})
                                            </div>
                                            <div className={`trade-type ${trade.side}`}>
                                                {trade.side?.toUpperCase()}
                                            </div>
                                            <div className="trade-status-text active">
                                                ACTIVE
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
                                                <span className="label">Take Profit:</span>
                                                <span className="value">+{trade.profitPercent}%</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
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

// src/components/Positions.jsx
import React, { useState } from "react";
import "./Positions.css";

export default function Positions() {
    const [activeTab, setActiveTab] = useState("active"); // active | completed

    // Mock data to match the image
    const activeTrades = [
        {
            id: 1,
            symbol: "BTC/USDT",
            amount: 1.00,
            entryPrice: 50000.00,
            currentPrice: 50000.00,
            pnl: 0.05,
            status: "losing", // winning | losing
            timeLeft: 31,
            totalTime: 60,
            type: "buy"
        }
    ];

    const completedTrades = [
        {
            id: 2,
            symbol: "ETH/USDT",
            amount: 10.00,
            entryPrice: 3000.00,
            exitPrice: 3050.00,
            pnl: 5.00,
            status: "won",
            date: "2025-11-28 14:30"
        }
    ];

    return (
        <div className="positions-container">
            {/* Tabs */}
            <div className="positions-tabs">
                <button
                    className={`pos-tab ${activeTab === "active" ? "active" : ""}`}
                    onClick={() => setActiveTab("active")}
                >
                    Active <span className="badge-count">1</span>
                </button>
                <button
                    className={`pos-tab ${activeTab === "completed" ? "completed" : ""}`}
                    onClick={() => setActiveTab("completed")}
                >
                    Completed <span className="badge-count success">1</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="positions-toolbar">
                <button className="force-refresh-btn">
                    ↻ Force Refresh
                </button>
                <span className="last-updated">Last updated: 0s ago</span>
            </div>

            {/* Content */}
            <div className="positions-content">
                {activeTab === "active" ? (
                    <div className="trades-list">
                        {activeTrades.map((trade) => (
                            <div key={trade.id} className={`trade-row ${trade.status}`}>
                                <div className="trade-row-header">
                                    <div className="trade-symbol">
                                        <span className="coin-icon">₿</span>
                                        {trade.symbol}
                                    </div>
                                    <div className={`trade-type ${trade.type}`}>{trade.type.toUpperCase()}</div>
                                    <div className={`trade-status-text ${trade.status}`}>
                                        {trade.status}
                                    </div>
                                </div>

                                <div className="trade-details-grid">
                                    <div className="detail-col">
                                        <span className="label">Amount:</span>
                                        <span className="value">${trade.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="detail-col">
                                        <span className="label">Entry:</span>
                                        <span className="value">${trade.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="detail-col">
                                        <span className="label">Current:</span>
                                        <span className="value highlight">${trade.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="detail-col">
                                        <span className="label">P&L:</span>
                                        <span className={`value ${trade.pnl >= 0 ? "positive" : "negative"}`}>
                                            ${trade.pnl.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="trade-progress-container">
                                    <div className="progress-info">
                                        <span>{trade.timeLeft}s</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${(trade.timeLeft / trade.totalTime) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="view-details-btn">View Details</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="trades-list">
                        {completedTrades.map((trade) => (
                            <div key={trade.id} className="trade-row won">
                                <div className="trade-row-header">
                                    <div className="trade-symbol">
                                        <span className="coin-icon">Ξ</span>
                                        {trade.symbol}
                                    </div>
                                    <div className="trade-status-text won">PROFIT</div>
                                </div>
                                <div className="trade-details-grid">
                                    <div className="detail-col">
                                        <span className="label">Amount:</span>
                                        <span className="value">${trade.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="detail-col">
                                        <span className="label">Profit:</span>
                                        <span className="value positive">+${trade.pnl.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// src/pages/admin/Trades.jsx
import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { getAllTrades, getActiveTradesForAdmin, forceTradeResult } from "../../services/adminService";
import "./Users.css";

export default function Trades() {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredTrades, setFilteredTrades] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [showForceModal, setShowForceModal] = useState(false);
    const [forceResult, setForceResult] = useState("win");
    const [forcePnl, setForcePnl] = useState("");
    const [activeTab, setActiveTab] = useState("active"); // "active" or "history"

    useEffect(() => {
        loadTrades();
    }, [activeTab]);

    // Filter trades whenever search query or trades list changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredTrades(trades);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = trades.filter(trade =>
                (trade.userEmail?.toLowerCase() || "").includes(query) ||
                (trade.userName?.toLowerCase() || "").includes(query) ||
                (trade.asset?.toLowerCase() || "").includes(query) ||
                (trade.uid?.toLowerCase() || "").includes(query) ||
                (trade.id?.toLowerCase() || "").includes(query)
            );
            setFilteredTrades(filtered);
        }
    }, [searchQuery, trades]);

    const loadTrades = async () => {
        try {
            setLoading(true);
            let data;
            if (activeTab === "active") {
                data = await getActiveTradesForAdmin();
            } else {
                data = await getAllTrades();
            }
            setTrades(data);
            setFilteredTrades(data);
        } catch (error) {
            console.error("Error loading trades:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleForceResult = async () => {
        try {
            await forceTradeResult(selectedTrade.id, forceResult, parseFloat(forcePnl));
            setShowForceModal(false);
            setForcePnl("");
            loadTrades();
        } catch (error) {
            console.error("Error forcing trade result:", error);
        }
    };

    const columns = [
        {
            header: "User",
            key: "userEmail",
            render: (value, row) => (
                <div>
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px' }}>{value || row.uid}</div>
                    {row.userName && row.userName !== 'Unknown' && (
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{row.userName}</div>
                    )}
                </div>
            )
        },
        {
            header: "Asset",
            key: "asset",
            render: (value) => <span style={{ fontWeight: 600 }}>{value}</span>
        },
        {
            header: "Type",
            key: "type",
            render: (value) => (
                <span className={`badge badge-${value === 'buy' ? 'success' : 'danger'}`}>
                    {value?.toUpperCase()}
                </span>
            )
        },
        {
            header: "Amount",
            key: "amount",
            render: (value) => `$${value?.toFixed(2)}`
        },
        {
            header: "Entry Price",
            key: "entryPrice",
            render: (value) => `$${value?.toFixed(2)}`
        },
        {
            header: "Status",
            key: "status",
            render: (value) => (
                <span className={`badge badge-${value === 'active' ? 'warning' : value === 'closed' ? 'info' : 'success'}`}>
                    {value}
                </span>
            )
        },
        {
            header: "P&L",
            key: "pnl",
            render: (value, row) => {
                if (row.status === 'active') return '-';
                return (
                    <span style={{ color: value >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {value >= 0 ? '+' : ''}${value?.toFixed(2)}
                    </span>
                );
            }
        },
        {
            header: "Date",
            key: "createdAt",
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
    ];

    const actions = (row) => (
        row.status === 'active' && (
            <button
                className="action-btn action-btn-primary"
                onClick={() => {
                    setSelectedTrade(row);
                    setShowForceModal(true);
                }}
            >
                Force Result
            </button>
        )
    );

    if (loading) return <div className="loading-state">Loading trades...</div>;

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">Manage Trades</h1>
                    <p className="page-subtitle">View and force trade results</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="filter-tabs" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className={`filter-tab ${activeTab === "active" ? "active" : ""}`}
                        onClick={() => setActiveTab("active")}
                    >
                        Active Trades
                    </button>
                    <button
                        className={`filter-tab ${activeTab === "history" ? "active" : ""}`}
                        onClick={() => setActiveTab("history")}
                    >
                        Trade History
                    </button>
                </div>
                <button
                    onClick={loadTrades}
                    className="action-btn action-btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Search Bar */}
            <div className="search-bar glass-card" style={{ marginBottom: '24px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                    type="text"
                    placeholder="Search trades by user email, name, or asset..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="search-clear"
                        title="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>

            <DataTable columns={columns} data={filteredTrades} actions={actions} />

            {/* Force Result Modal */}
            <Modal
                isOpen={showForceModal}
                onClose={() => setShowForceModal(false)}
                title="Force Trade Result"
            >
                <div className="modal-content">
                    <div className="form-group">
                        <label className="form-label">Trade</label>
                        <div className="user-info-display">
                            {selectedTrade?.asset} - ${selectedTrade?.amount?.toFixed(2)}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Result</label>
                        <select
                            className="form-input"
                            value={forceResult}
                            onChange={(e) => setForceResult(e.target.value)}
                        >
                            <option value="win">Win</option>
                            <option value="loss">Loss</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">P&L Amount ($)</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="Enter profit/loss amount"
                            value={forcePnl}
                            onChange={(e) => setForcePnl(e.target.value)}
                            step="0.01"
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowForceModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleForceResult}
                            disabled={!forcePnl}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

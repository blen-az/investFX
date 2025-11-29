// src/pages/admin/Trades.jsx
import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { getAllTrades, forceTradeResult } from "../../services/adminService";
import "./Users.css";

export default function Trades() {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [showForceModal, setShowForceModal] = useState(false);
    const [forceResult, setForceResult] = useState("win");
    const [forcePnl, setForcePnl] = useState("");

    useEffect(() => {
        loadTrades();
    }, []);

    const loadTrades = async () => {
        try {
            setLoading(true);
            const data = await getAllTrades();
            setTrades(data);
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
            header: "User ID",
            key: "uid",
            render: (value) => <span style={{ fontSize: '12px', color: '#94a3b8' }}>{value}</span>
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
            <DataTable columns={columns} data={trades} actions={actions} />

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

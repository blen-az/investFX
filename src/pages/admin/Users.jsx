// src/pages/admin/Users.jsx
import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { getAllUsers, setUserBalance, freezeUser } from "../../services/adminService";
import { setUserTradeControl } from "../../services/tradeSettingsService";
import "./Users.css";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [balanceAmount, setBalanceAmount] = useState("");
    const [balanceOperation, setBalanceOperation] = useState("set");

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFreezeUser = async (userId, freeze) => {
        try {
            await freezeUser(userId, freeze);
            await loadUsers();
        } catch (error) {
            console.error("Error freezing user:", error);
        }
    };

    const handleSetBalance = async () => {
        try {
            await setUserBalance(selectedUser.id, parseFloat(balanceAmount), balanceOperation);
            setShowBalanceModal(false);
            setBalanceAmount("");
            await loadUsers();
        } catch (error) {
            console.error("Error setting balance:", error);
        }
    };

    const columns = [
        {
            header: "Name",
            key: "name",
            render: (value, row) => (
                <div>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{value || row.email.split('@')[0]}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{row.email}</div>
                </div>
            )
        },
        {
            header: "Role",
            key: "role",
            render: (value) => (
                <span className={`badge badge-${value}`}>
                    {value}
                </span>
            )
        },
        {
            header: "Balance",
            key: "balance",
            render: (value) => `$${value?.toFixed(2) || '0.00'}`
        },
        {
            header: "Referred By",
            key: "referredBy",
            render: (value, row) => {
                if (!value) return <span style={{ color: '#64748b' }}>Direct signup</span>;

                // Find the agent who referred this user
                const agent = users.find(u => u.id === value);
                return (
                    <div>
                        <span className="badge badge-agent" style={{ fontSize: '10px' }}>
                            {agent ? agent.name || agent.email.split('@')[0] : value}
                        </span>
                    </div>
                );
            }
        },
        {
            header: "Status",
            key: "frozen",
            render: (value) => (
                <span className={`badge ${value ? 'badge-danger' : 'badge-success'}`}>
                    {value ? 'Frozen' : 'Active'}
                </span>
            )
        },
        {
            header: "Trade Control",
            key: "tradeControl",
            render: (value) => {
                const mode = value || 'auto';
                const colors = {
                    auto: '#06b6d4',
                    force_win: '#10b981',
                    force_loss: '#ef4444'
                };
                const labels = {
                    auto: 'Auto',
                    force_win: 'Force Win',
                    force_loss: 'Force Loss'
                };
                return (
                    <span className="badge" style={{ background: colors[mode], color: 'white' }}>
                        {labels[mode]}
                    </span>
                );
            }
        },
        {
            header: "Joined",
            key: "createdAt",
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
    ];

    const actions = (row) => (
        <>
            <button
                className="action-btn action-btn-primary"
                onClick={() => {
                    setSelectedUser(row);
                    setShowBalanceModal(true);
                }}
            >
                Set Balance
            </button>
            <button
                className={`action-btn ${row.frozen ? 'action-btn-success' : 'action-btn-danger'}`}
                onClick={() => handleFreezeUser(row.id, !row.frozen)}
            >
                {row.frozen ? 'Unfreeze' : 'Freeze'}
            </button>
            <select
                className="action-btn"
                value={row.tradeControl || 'auto'}
                onChange={async (e) => {
                    try {
                        await setUserTradeControl(row.id, e.target.value);
                        await loadUsers();
                    } catch (error) {
                        console.error("Error setting trade control:", error);
                    }
                }}
                style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '6px',
                    color: '#06b6d4',
                    fontWeight: 600,
                    fontSize: '13px'
                }}
            >
                <option value="auto" style={{ background: '#1a1f2e', color: '#06b6d4' }}>Auto</option>
                <option value="force_win" style={{ background: '#1a1f2e', color: '#10b981' }}>Force Win</option>
                <option value="force_loss" style={{ background: '#1a1f2e', color: '#ef4444' }}>Force Loss</option>
            </select>
        </>
    );

    if (loading) {
        return (
            <div className="users-page">
                <div className="loading-state">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">User Management</h1>
                    <p className="page-subtitle">Manage all platform users</p>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total Users</span>
                        <span className="stat-value">{users.length}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Agents</span>
                        <span className="stat-value">{users.filter(u => u.role === 'agent').length}</span>
                    </div>
                </div>
            </div>

            <DataTable columns={columns} data={users} actions={actions} />

            {/* Balance Modal */}
            <Modal
                isOpen={showBalanceModal}
                onClose={() => setShowBalanceModal(false)}
                title="Set User Balance"
            >
                <div className="modal-content">
                    <div className="form-group">
                        <label className="form-label">User</label>
                        <div className="user-info-display">
                            {selectedUser?.name || selectedUser?.email}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Operation</label>
                        <select
                            className="form-input"
                            value={balanceOperation}
                            onChange={(e) => setBalanceOperation(e.target.value)}
                        >
                            <option value="set">Set Balance</option>
                            <option value="add">Add to Balance</option>
                            <option value="subtract">Subtract from Balance</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Amount ($)</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="Enter amount"
                            value={balanceAmount}
                            onChange={(e) => setBalanceAmount(e.target.value)}
                            step="0.01"
                            min="0"
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowBalanceModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSetBalance}
                            disabled={!balanceAmount}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

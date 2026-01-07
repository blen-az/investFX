// src/pages/admin/Withdrawals.jsx
import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import { getAllWithdrawals, approveWithdrawal, rejectWithdrawal } from "../../services/adminService";
import "./Users.css";

export default function Withdrawals() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWithdrawals();
    }, []);

    const loadWithdrawals = async () => {
        try {
            setLoading(true);
            const data = await getAllWithdrawals("pending");
            setWithdrawals(data);
        } catch (error) {
            console.error("Error loading withdrawals:", error);
            alert(`Error loading withdrawals: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (window.confirm("Are you sure you want to approve this withdrawal?")) {
            try {
                await approveWithdrawal(id);
                loadWithdrawals();
            } catch (error) {
                console.error("Error approving withdrawal:", error);
            }
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt("Enter rejection reason:");
        if (reason) {
            try {
                await rejectWithdrawal(id, reason);
                loadWithdrawals();
            } catch (error) {
                console.error("Error rejecting withdrawal:", error);
            }
        }
    };

    const columns = [
        {
            header: "User",
            key: "uid",
            render: (value, row) => {
                const userEmail = row.userEmail || "Unknown Email";
                const userName = row.userName || userEmail?.split('@')[0] || "Unknown User";
                return (
                    <div>
                        <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '14px' }}>{userEmail}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{userName}</div>
                    </div>
                );
            }
        },
        {
            header: "Amount",
            key: "amount",
            render: (value) => <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '16px' }}>${value?.toFixed(2)}</span>
        },
        {
            header: "Asset",
            key: "asset",
            render: (value) => <span className="badge badge-info">{value || 'USD'}</span>
        },
        {
            header: "Wallet Address",
            key: "address",
            render: (value) => (
                <span style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    fontFamily: 'monospace',
                    whiteSpace: 'normal',
                    wordBreak: 'break-all',
                    display: 'block',
                    minWidth: '150px'
                }}>
                    {value || '-'}
                </span>
            )
        },
        {
            header: "Status",
            key: "status",
            render: (value) => (
                <span className={`badge badge-${value === 'approved' ? 'success' : value === 'rejected' ? 'danger' : 'warning'}`}>
                    {value}
                </span>
            )
        },
        {
            header: "Date",
            key: "createdAt",
            render: (value) => value ? new Date(value).toLocaleString() : '-'
        }
    ];

    const actions = (row) => (
        row.status === 'pending' && (
            <>
                <button
                    className="action-btn action-btn-success"
                    onClick={() => handleApprove(row.id)}
                >
                    Approve
                </button>
                <button
                    className="action-btn action-btn-danger"
                    onClick={() => handleReject(row.id)}
                >
                    Reject
                </button>
            </>
        )
    );

    if (loading) return <div className="loading-state">Loading withdrawals...</div>;

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">Manage Withdrawals</h1>
                    <p className="page-subtitle">Review and approve user withdrawals</p>
                </div>
            </div>
            <DataTable columns={columns} data={withdrawals} actions={actions} />
        </div>
    );
}

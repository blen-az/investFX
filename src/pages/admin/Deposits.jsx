// src/pages/admin/Deposits.jsx
import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import { getAllDeposits, approveDeposit, rejectDeposit } from "../../services/adminService";
import "./Users.css"; // Reuse users styles for consistency

export default function Deposits() {
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDeposits();
    }, []);

    const loadDeposits = async () => {
        try {
            setLoading(true);
            const data = await getAllDeposits();
            setDeposits(data);
        } catch (error) {
            console.error("Error loading deposits:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (window.confirm("Are you sure you want to approve this deposit?")) {
            try {
                await approveDeposit(id);
                loadDeposits();
            } catch (error) {
                console.error("Error approving deposit:", error);
            }
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt("Enter rejection reason:");
        if (reason) {
            try {
                await rejectDeposit(id, reason);
                loadDeposits();
            } catch (error) {
                console.error("Error rejecting deposit:", error);
            }
        }
    };

    const columns = [
        {
            header: "User",
            key: "uid",
            render: (value, row) => {
                // Find user details
                const userEmail = row.userEmail || value;
                const userName = row.userName || userEmail?.split('@')[0];
                return (
                    <div>
                        <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '14px' }}>{userName}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{userEmail}</div>
                    </div>
                );
            }
        },
        {
            header: "Amount",
            key: "amount",
            render: (value) => <span style={{ color: '#10b981', fontWeight: 600, fontSize: '16px' }}>${value?.toFixed(2)}</span>
        },
        {
            header: "Method",
            key: "method",
            render: (value) => <span className="badge badge-info">{value || 'Bank Transfer'}</span>
        },
        {
            header: "Transaction ID",
            key: "transactionId",
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
            header: "Proof",
            key: "proofUrl",
            render: (value) => value ? (
                <a href={value} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    borderRadius: '4px',
                    fontSize: '12px',
                    textDecoration: 'none'
                }}>
                    View Image ↗
                </a>
            ) : (
                <span style={{ color: '#64748b', fontSize: '12px' }}>No Proof</span>
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

    if (loading) return <div className="loading-state">Loading deposits...</div>;

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">Manage Deposits</h1>
                    <p className="page-subtitle">Review and approve user deposits</p>
                </div>
            </div>
            <DataTable columns={columns} data={deposits} actions={actions} />
        </div>
    );
}

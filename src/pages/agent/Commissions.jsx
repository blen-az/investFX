// src/pages/agent/Commissions.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DataTable from "../../components/DataTable";
import { getCommissionHistory } from "../../services/agentService";
import "./Commissions.css";

export default function AgentCommissions() {
    const { user } = useAuth();
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEarned: 0,
        thisMonth: 0,
        totalDeposits: 0
    });

    useEffect(() => {
        if (user?.uid) {
            loadCommissions();
        }
    }, [user]);

    const loadCommissions = async () => {
        try {
            setLoading(true);
            const history = await getCommissionHistory(user.uid);
            setCommissions(history);

            // Calculate stats
            const totalEarned = history.reduce((sum, c) => sum + (c.agentCommission || 0), 0);
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            const thisMonth = history
                .filter(c => c.createdAt >= monthStart)
                .reduce((sum, c) => sum + (c.agentCommission || 0), 0);

            const totalDeposits = history.reduce((sum, c) => sum + (c.depositAmount || 0), 0);

            setStats({ totalEarned, thisMonth, totalDeposits });
        } catch (error) {
            console.error("Error loading commissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: "Date",
            key: "createdAt",
            render: (value) => value ? new Date(value).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : '-'
        },
        {
            header: "User",
            key: "userId",
            render: (value) => (
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>
                    {value.substring(0, 8)}...
                </div>
            )
        },
        {
            header: "Deposit Amount",
            key: "depositAmount",
            render: (value) => (
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                    ${value?.toFixed(2) || '0.00'}
                </span>
            )
        },
        {
            header: "Your Commission (4%)",
            key: "agentCommission",
            render: (value) => (
                <span style={{ fontWeight: 600, color: '#10b981' }}>
                    +${value?.toFixed(2) || '0.00'}
                </span>
            )
        }
    ];

    if (loading) {
        return (
            <div className="commissions-page">
                <div className="loading-state">Loading commission history...</div>
            </div>
        );
    }

    return (
        <div className="commissions-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">Commission History</h1>
                    <p className="page-subtitle">Complete breakdown of your earnings</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="commission-stats-grid">
                <div className="stat-card glass-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Earned</div>
                        <div className="stat-value">${stats.totalEarned.toFixed(2)}</div>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <div className="stat-label">This Month</div>
                        <div className="stat-value">${stats.thisMonth.toFixed(2)}</div>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Deposits Referred</div>
                        <div className="stat-value">${stats.totalDeposits.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="info-card glass-card" style={{ marginBottom: '24px' }}>
                <div className="info-icon">ℹ️</div>
                <div className="info-content">
                    <h3 className="info-title">How Commissions Work</h3>
                    <ul className="info-list">
                        <li>You earn commissions on every deposit from your referrals</li>
                        <li>Commission rate is 4% of the total deposit amount</li>
                        <li>Earnings are added to your balance automatically</li>
                    </ul>
                    <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <strong style={{ color: '#10b981' }}>Example:</strong> User deposits $1,000
                        <br />
                        → Your commission: $40 (4% of deposit)
                    </div>
                </div>
            </div>

            {/* Commission History Table */}
            <div className="section-header">
                <h2 className="section-title">Detailed Commission History</h2>
            </div>

            {commissions.length === 0 ? (
                <div className="empty-state-card glass-card">
                    <div className="empty-icon">💰</div>
                    <h3>No Commissions Yet</h3>
                    <p>You'll see commission records here when your referred users make deposits</p>
                </div>
            ) : (
                <DataTable columns={columns} data={commissions} />
            )}
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import StatsCard from "../../components/StatsCard";
import { getAllUsers, getAllDeposits, getAllWithdrawals, getAllTrades } from "../../services/adminService";
import {
    migrateAgentReferralCodes,
    getMigrationStatus,
    migrateShortIds,
    getShortIdMigrationStatus
} from "../../services/migrationService";
import "./AdminDashboard.css";

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0,
        activeTrades: 0,
        totalBalance: 0
    });
    const [loading, setLoading] = useState(true);
    const [migrationStatus, setMigrationStatus] = useState(null);
    const [migrating, setMigrating] = useState(false);
    const [migrationMessage, setMigrationMessage] = useState("");
    const [shortIdStatus, setShortIdStatus] = useState(null);
    const [migratingShortIds, setMigratingShortIds] = useState(false);
    const [shortIdMessage, setShortIdMessage] = useState("");

    useEffect(() => {
        loadDashboardStats();
        checkMigrationStatus();
    }, []);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);

            // Fetch all data
            const [users, deposits, withdrawals, trades] = await Promise.all([
                getAllUsers(),
                getAllDeposits(),
                getAllWithdrawals(),
                getAllTrades()
            ]);

            // Calculate stats
            const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
            const pendingDeposits = deposits.filter(d => d.status === "pending").length;
            const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
            const activeTrades = trades.filter(t => t.status === "active").length;

            setStats({
                totalUsers: users.length,
                pendingDeposits,
                pendingWithdrawals,
                activeTrades,
                totalBalance
            });
        } catch (error) {
            console.error("Error loading dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const checkMigrationStatus = async () => {
        try {
            const status = await getMigrationStatus();
            setMigrationStatus(status);
            const sIdStatus = await getShortIdMigrationStatus();
            setShortIdStatus(sIdStatus);
        } catch (error) {
            console.error("Error checking migration status:", error);
        }
    };

    const handleMigration = async () => {
        if (!window.confirm("This will assign referral codes to all agents who don't have one. Continue?")) {
            return;
        }

        try {
            setMigrating(true);
            setMigrationMessage("");
            const result = await migrateAgentReferralCodes();
            setMigrationMessage(result.message);
            await checkMigrationStatus();
        } catch (error) {
            setMigrationMessage("Migration failed: " + error.message);
        } finally {
            setMigrating(false);
        }
    };

    const handleShortIdMigration = async () => {
        if (!window.confirm("This will generate Short IDs for all users who don't have one. Continue?")) {
            return;
        }

        try {
            setMigratingShortIds(true);
            setShortIdMessage("");
            const result = await migrateShortIds();
            setShortIdMessage(result.message);
            await checkMigrationStatus();
        } catch (error) {
            setShortIdMessage("Migration failed: " + error.message);
        } finally {
            setMigratingShortIds(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="loading-state">
                    <div className="gradient-text">Loading dashboard...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title gradient-text">Admin Dashboard</h1>
                    <p className="admin-subtitle">Welcome back, {user?.email}</p>
                </div>
            </div>

            <div className="stats-grid">
                <StatsCard
                    icon="👥"
                    label="Total Users"
                    value={stats.totalUsers}
                    color="cyan"
                />
                <StatsCard
                    icon="💰"
                    label="Total Platform Balance"
                    value={`$${stats.totalBalance.toFixed(2)}`}
                    color="green"
                />
                <StatsCard
                    icon="📥"
                    label="Pending Deposits"
                    value={stats.pendingDeposits}
                    color="yellow"
                />
                <StatsCard
                    icon="📤"
                    label="Pending Withdrawals"
                    value={stats.pendingWithdrawals}
                    color="yellow"
                />
                <StatsCard
                    icon="📊"
                    label="Active Trades"
                    value={stats.activeTrades}
                    color="blue"
                />
            </div>

            <div className="admin-quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="action-grid">
                    <Link to="/admin/users" className="action-card glass-card">
                        <div className="action-icon">👥</div>
                        <div className="action-title">Manage Users</div>
                        <div className="action-desc">View and edit user accounts</div>
                    </Link>

                    <Link to="/admin/agents" className="action-card glass-card">
                        <div className="action-icon">👔</div>
                        <div className="action-title">Manage Agents</div>
                        <div className="action-desc">View agents and downlines</div>
                    </Link>

                    <Link to="/admin/deposits" className="action-card glass-card">
                        <div className="action-icon">📥</div>
                        <div className="action-title">Approve Deposits</div>
                        <div className="action-desc">Review pending deposits</div>
                    </Link>

                    <Link to="/admin/withdrawals" className="action-card glass-card">
                        <div className="action-icon">📤</div>
                        <div className="action-title">Approve Withdrawals</div>
                        <div className="action-desc">Review pending withdrawals</div>
                    </Link>

                    <Link to="/admin/trades" className="action-card glass-card">
                        <div className="action-icon">📊</div>
                        <div className="action-title">Manage Trades</div>
                        <div className="action-desc">View and force trade results</div>
                    </Link>

                    <Link to="/admin/create-agent" className="action-card glass-card">
                        <div className="action-icon">⭐</div>
                        <div className="action-title">Create Agent</div>
                        <div className="action-desc">Upgrade users to agents</div>
                    </Link>

                    <Link to="/admin/trade-settings" className="action-card glass-card">
                        <div className="action-icon">🎮</div>
                        <div className="action-title">Trade Settings</div>
                        <div className="action-desc">Control trade outcomes</div>
                    </Link>

                    <Link to="/admin/commissions" className="action-card glass-card">
                        <div className="action-icon">💰</div>
                        <div className="action-title">Commissions</div>
                        <div className="action-desc">Track platform revenue</div>
                    </Link>

                    <Link to="/admin/verifications" className="action-card glass-card">
                        <div className="action-icon">🆔</div>
                        <div className="action-title">ID Verifications</div>
                        <div className="action-desc">Review user documents</div>
                    </Link>

                    <Link to="/admin/settings" className="action-card glass-card">
                        <div className="action-icon">⚙️</div>
                        <div className="action-title">Settings</div>
                        <div className="action-desc">Manage your account</div>
                    </Link>
                </div>
            </div>

            {/* Migration Tools */}
            {(migrationStatus?.needsMigration || shortIdStatus?.needsMigration) && (
                <div className="migration-section" style={{ marginTop: '32px' }}>
                    <h2 className="section-title">🔧 Migration Tools</h2>

                    {migrationStatus?.needsMigration && (
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>Agent Referral Codes</h3>
                                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                                    {migrationStatus.agentsWithoutCodes} agent(s) need referral codes assigned.
                                </p>
                            </div>

                            {migrationMessage && (
                                <div style={{
                                    padding: '12px',
                                    marginBottom: '16px',
                                    background: migrationMessage.includes('failed') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    border: `1px solid ${migrationMessage.includes('failed') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                    borderRadius: '8px',
                                    color: migrationMessage.includes('failed') ? '#ef4444' : '#10b981',
                                    fontSize: '14px'
                                }}>
                                    {migrationMessage}
                                </div>
                            )}

                            <button
                                onClick={handleMigration}
                                disabled={migrating}
                                style={{
                                    padding: '12px 24px',
                                    background: migrating ? '#64748b' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: migrating ? 'not-allowed' : 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                {migrating ? '⏳ Migrating...' : '🚀 Migrate Agent Referral Codes'}
                            </button>
                        </div>
                    )}

                    {shortIdStatus?.needsMigration && (
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>User Short IDs</h3>
                                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                                    {shortIdStatus.missingCount} user(s) need Short IDs generated.
                                </p>
                            </div>

                            {shortIdMessage && (
                                <div style={{
                                    padding: '12px',
                                    marginBottom: '16px',
                                    background: shortIdMessage.includes('failed') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    border: `1px solid ${shortIdMessage.includes('failed') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                    borderRadius: '8px',
                                    color: shortIdMessage.includes('failed') ? '#ef4444' : '#10b981',
                                    fontSize: '14px'
                                }}>
                                    {shortIdMessage}
                                </div>
                            )}

                            <button
                                onClick={handleShortIdMigration}
                                disabled={migratingShortIds}
                                style={{
                                    padding: '12px 24px',
                                    background: migratingShortIds ? '#64748b' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: migratingShortIds ? 'not-allowed' : 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                {migratingShortIds ? '⏳ Generating...' : '⚡ Generate Short IDs'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

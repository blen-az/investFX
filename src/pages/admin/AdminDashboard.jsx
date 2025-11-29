// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import StatsCard from "../../components/StatsCard";
import { getAllUsers, getAllDeposits, getAllWithdrawals, getAllTrades } from "../../services/adminService";
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

    useEffect(() => {
        loadDashboardStats();
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
                    <a href="/admin/users" className="action-card glass-card">
                        <div className="action-icon">👥</div>
                        <div className="action-title">Manage Users</div>
                        <div className="action-desc">View and edit user accounts</div>
                    </a>

                    <a href="/admin/deposits" className="action-card glass-card">
                        <div className="action-icon">📥</div>
                        <div className="action-title">Approve Deposits</div>
                        <div className="action-desc">Review pending deposits</div>
                    </a>

                    <a href="/admin/withdrawals" className="action-card glass-card">
                        <div className="action-icon">📤</div>
                        <div className="action-title">Approve Withdrawals</div>
                        <div className="action-desc">Review pending withdrawals</div>
                    </a>

                    <a href="/admin/trades" className="action-card glass-card">
                        <div className="action-icon">📊</div>
                        <div className="action-title">Manage Trades</div>
                        <div className="action-desc">View and force trade results</div>
                    </a>

                    <a href="/admin/users" className="action-card glass-card">
                        <div className="action-icon">💵</div>
                        <div className="action-title">Set Balance</div>
                        <div className="action-desc">Edit user balances</div>
                    </a>

                    <a href="/admin/create-agent" className="action-card glass-card">
                        <div className="action-icon">⭐</div>
                        <div className="action-title">Create Agent</div>
                        <div className="action-desc">Upgrade users to agents</div>
                    </a>

                    <a href="/admin/trade-settings" className="action-card glass-card">
                        <div className="action-icon">🎮</div>
                        <div className="action-title">Trade Settings</div>
                        <div className="action-desc">Control trade outcomes</div>
                    </a>
                </div>
            </div>
        </div>
    );
}

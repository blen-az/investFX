// src/pages/agent/Referrals.jsx - Enhanced with export, filtering, sorting
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable";
import { getReferredUsers, generateReferralLink, getAgentReferralCode } from "../../services/agentService";
import "./Referrals.css";

export default function Referrals() {
    const { user } = useAuth();
    if (user?.uid) {
        loadData();
    }
}, [user]);

const loadData = async () => {
    try {
        setLoading(true);

        // Fetch referral code
        const code = await getAgentReferralCode(user.uid);
        if (code) {
            setReferralCode(code);
            const link = generateReferralLink(code);
            setReferralLink(link);
        }

        // Fetch referred users
        const referred = await getReferredUsers(user.uid);
        setReferredUsers(referred);
    } catch (error) {
        console.error("Error loading data:", error);
    } finally {
        setLoading(false);
    }
};

const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
};

// Export to CSV
const exportToCSV = () => {
    const headers = ["Name", "Email", "Balance", "Status", "Joined"];
    const rows = filteredAndSortedUsers.map(user => [
        user.name || user.email.split('@')[0],
        user.email,
        `$${user.balance?.toFixed(2) || '0.00'}`,
        user.frozen ? "Frozen" : "Active",
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

// Filter users
const filterUsers = (users) => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(user => {
            const name = (user.name || user.email.split('@')[0]).toLowerCase();
            const email = user.email.toLowerCase();
            return name.includes(search) || email.includes(search);
        });
    }

    // Status filter
    if (statusFilter !== "all") {
        filtered = filtered.filter(user => {
            if (statusFilter === "active") return !user.frozen;
            if (statusFilter === "frozen") return user.frozen;
            return true;
        });
    }

    // Date filter
    if (dateFilter !== "all") {
        const now = new Date();
        filtered = filtered.filter(user => {
            if (!user.createdAt) return false;
            const userDate = new Date(user.createdAt);

            if (dateFilter === "this_week") {
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                return userDate >= weekAgo;
            }

            if (dateFilter === "this_month") {
                return userDate.getMonth() === now.getMonth() &&
                    userDate.getFullYear() === now.getFullYear();
            }

            if (dateFilter === "last_month") {
                const lastMonth = new Date(now);
                lastMonth.setMonth(now.getMonth() - 1);
                return userDate.getMonth() === lastMonth.getMonth() &&
                    userDate.getFullYear() === lastMonth.getFullYear();
            }

            return true;
        });
    }

    return filtered;
};

// Sort users
const sortUsers = (users) => {
    if (!sortConfig.key) return users;

    const sorted = [...users].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle special cases
        if (sortConfig.key === "name") {
            aVal = (a.name || a.email.split('@')[0]).toLowerCase();
            bVal = (b.name || b.email.split('@')[0]).toLowerCase();
        }

        if (sortConfig.key === "createdAt") {
            aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    return sorted;
};

const handleSort = (key) => {
    setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
};

const filteredAndSortedUsers = sortUsers(filterUsers(referredUsers));

// Calculate total balance
const totalBalance = referredUsers.reduce((sum, user) => sum + (user.balance || 0), 0);

// Enhanced columns with sorting
const columns = [
    {
        header: (
            <div onClick={() => handleSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>
                Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
            </div>
        ),
        key: "name",
        render: (value, row) => (
            <div
                onClick={() => navigate(`/admin/users`)}
                style={{ cursor: "pointer" }}
            >
                <div style={{ fontWeight: 600, color: '#f8fafc' }}>{value || row.email.split('@')[0]}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{row.email}</div>
            </div>
        )
    },
    {
        header: (
            <div onClick={() => handleSort("balance")} style={{ cursor: "pointer", userSelect: "none" }}>
                Balance {sortConfig.key === "balance" && (sortConfig.direction === "asc" ? "↑" : "↓")}
            </div>
        ),
        key: "balance",
        render: (value) => `$${value?.toFixed(2) || '0.00'}`
    },
    {
        header: (
            <div onClick={() => handleSort("frozen")} style={{ cursor: "pointer", userSelect: "none" }}>
                Status {sortConfig.key === "frozen" && (sortConfig.direction === "asc" ? "↑" : "↓")}
            </div>
        ),
        key: "frozen",
        render: (value) => (
            <span className={`badge ${value ? 'badge-danger' : 'badge-success'}`}>
                {value ? 'Frozen' : 'Active'}
            </span>
        )
    },
    {
        header: (
            <div onClick={() => handleSort("createdAt")} style={{ cursor: "pointer", userSelect: "none" }}>
                Joined {sortConfig.key === "createdAt" && (sortConfig.direction === "asc" ? "↑" : "↓")}
            </div>
        ),
        key: "createdAt",
        render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    }
];

if (loading) {
    return (
        <div className="referrals-page">
            <div className="loading-state">Loading referrals...</div>
        </div>
    );
}

return (
    <div className="referrals-page">
        <div className="page-header">
            <div>
                <h1 className="page-title gradient-text">My Referrals</h1>
                <p className="page-subtitle">Users you've referred to the platform</p>
            </div>
            <div className="header-stats">
                <div className="stat-item">
                    <span className="stat-label">Total Referrals</span>
                    <span className="stat-value">{referredUsers.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Total Balance</span>
                    <span className="stat-value">${totalBalance.toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* Referral Code Card */}
        <div className="referral-card glass-card" style={{ marginBottom: '20px' }}>
            <div className="referral-header">
                <div className="referral-icon">🎯</div>
                <div>
                    <h2 className="referral-title">Your Referral Code</h2>
                    <p className="referral-subtitle">Share this code with potential signups</p>
                </div>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'rgba(6, 182, 212, 0.1)',
                borderRadius: '12px',
                border: '2px solid rgba(6, 182, 212, 0.3)'
            }}>
                <div style={{
                    flex: 1,
                    fontSize: '2rem',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                    color: '#06b6d4',
                    textAlign: 'center',
                    letterSpacing: '4px'
                }}>
                    {referralCode || "Loading..."}
                </div>
                <button onClick={copyReferralLink} className="copy-btn">
                    {copied ? "Copied!" : "Copy Link"}
                </button>
            </div>
        </div>

        {/* Filters and Actions */}
        <div className="filters-section glass-card" style={{ marginBottom: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                    {/* Search */}
                    <div style={{ position: 'relative', minWidth: '200px' }}>
                        <svg style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '16px',
                            height: '16px',
                            color: '#94a3b8'
                        }} viewBox="0 0 24 24" fill="none">
                            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 36px',
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '10px 12px',
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#f8fafc',
                            fontSize: '14px'
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="frozen">Frozen Only</option>
                    </select>

                    {/* Date Filter */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{
                            padding: '10px 12px',
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '8px',
                            color: '#f8fafc',
                            fontSize: '14px'
                        }}
                    >
                        <option value="all">All Time</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                    </select>
                </div>

                {/* Export Button */}
                <button
                    onClick={exportToCSV}
                    disabled={filteredAndSortedUsers.length === 0}
                    style={{
                        padding: '10px 20px',
                        background: filteredAndSortedUsers.length > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#64748b',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: 600,
                        cursor: filteredAndSortedUsers.length > 0 ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Export CSV
                </button>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || statusFilter !== "all" || dateFilter !== "all") && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>Active filters:</span>
                    {searchTerm && (
                        <span style={{
                            padding: '4px 8px',
                            background: 'rgba(6, 182, 212, 0.2)',
                            border: '1px solid rgba(6, 182, 212, 0.4)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#06b6d4'
                        }}>
                            Search: "{searchTerm}"
                        </span>
                    )}
                    {statusFilter !== "all" && (
                        <span style={{
                            padding: '4px 8px',
                            background: 'rgba(6, 182, 212, 0.2)',
                            border: '1px solid rgba(6, 182, 212, 0.4)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#06b6d4'
                        }}>
                            Status: {statusFilter}
                        </span>
                    )}
                    {dateFilter !== "all" && (
                        <span style={{
                            padding: '4px 8px',
                            background: 'rgba(6, 182, 212, 0.2)',
                            border: '1px solid rgba(6, 182, 212, 0.4)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#06b6d4'
                        }}>
                            Date: {dateFilter.replace('_', ' ')}
                        </span>
                    )}
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("all");
                            setDateFilter("all");
                        }}
                        style={{
                            padding: '4px 8px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#ef4444',
                            cursor: 'pointer'
                        }}
                    >
                        Clear all
                    </button>
                </div>
            )}
        </div>

        {/* Referred Users Table */}
        <div className="section-header">
            <h2 className="section-title">
                Referred Users ({filteredAndSortedUsers.length})
            </h2>
        </div>

        {referredUsers.length === 0 ? (
            <div className="empty-state-card glass-card">
                <div className="empty-icon">👥</div>
                <h3>No Referrals Yet</h3>
                <p>Share your referral link to start earning commissions</p>
                <button onClick={copyReferralLink} className="btn btn-primary" style={{ marginTop: '16px' }}>
                    Copy Referral Link
                </button>
            </div>
        ) : filteredAndSortedUsers.length === 0 ? (
            <div className="empty-state-card glass-card">
                <div className="empty-icon">🔍</div>
                <h3>No Results Found</h3>
                <p>Try adjusting your filters</p>
            </div>
        ) : (
            <DataTable columns={columns} data={filteredAndSortedUsers} />
        )}
    </div>
);
}

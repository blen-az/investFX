// src/pages/admin/AgentCreator.jsx
import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import { getAllUsers } from "../../services/adminService";
import { setUserRole } from "../../services/authService";
import "./AgentCreator.css";

export default function AgentCreator() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    const [upgrading, setUpgrading] = useState(new Set());

    useEffect(() => {
        loadUsers();
    }, []);

    // Filter users whenever search query or users list changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = users.filter(user =>
                (user.name?.toLowerCase() || "").includes(query) ||
                (user.email?.toLowerCase() || "").includes(query)
            );
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            // Only show regular users (not already agents or admins)
            const regularUsers = data.filter(u => u.role === 'user');
            setUsers(regularUsers);
            setFilteredUsers(regularUsers);
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgradeToAgent = async (userId) => {
        console.log("👉 Upgrade button clicked for user:", userId);

        if (!userId) {
            alert("Error: User ID is missing");
            return;
        }

        // Removed window.confirm to debug "button not working" reports
        // if (window.confirm("Are you sure you want to upgrade this user to an agent?")) {
        try {
            setUpgrading(prev => new Set(prev).add(userId));
            console.log("Starting setUserRole...");

            const result = await setUserRole(userId, "agent");
            console.log("setUserRole success:", result);

            alert(`Success! User upgraded to agent.\nRole: ${result.role}\nReferral Code: ${result.referralCode || 'None'}`);
            await loadUsers();
        } catch (error) {
            console.error("Error upgrading user:", error);
            alert("Failed to upgrade user: " + error.message);
        } finally {
            setUpgrading(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
        // }
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
            header: "Balance",
            key: "balance",
            render: (value) => `$${value?.toFixed(2) || '0.00'}`
        },
        {
            header: "Joined",
            key: "createdAt",
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
    ];

    const actions = (row) => (
        <button
            className="action-btn action-btn-primary"
            onClick={() => handleUpgradeToAgent(row.id)}
            disabled={upgrading.has(row.id)}
            style={{ opacity: upgrading.has(row.id) ? 0.7 : 1 }}
        >
            {upgrading.has(row.id) ? (
                <span>Processing...</span>
            ) : (
                <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Make Agent
                </>
            )}
        </button>
    );

    if (loading) {
        return (
            <div className="agent-creator-page">
                <div className="loading-state">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="agent-creator-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">Agent Management</h1>
                    <p className="page-subtitle">Upgrade existing users to agents</p>
                </div>

            </div>



            <div className="info-box" style={{ marginBottom: '24px' }}>
                <div className="info-icon">ℹ️</div>
                <div>
                    <div className="info-title">Agent Benefits</div>
                    <div className="info-text">Agents earn 40% commission on referred user deposits</div>
                </div>
            </div>

            <h3 style={{ marginBottom: '16px', color: '#f8fafc' }}>Upgrade Existing Users</h3>

            {/* Search Bar */}
            <div className="search-bar glass-card" style={{ marginBottom: '24px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                    type="text"
                    placeholder="Search users by name or email..."
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

            {users.length === 0 ? (
                <div className="empty-state-card glass-card">
                    <div className="empty-icon">👥</div>
                    <h3>No Regular Users</h3>
                    <p>All users are already agents or admins</p>
                </div>
            ) : (
                <DataTable columns={columns} data={filteredUsers} actions={actions} />
            )}
        </div>
    );
}

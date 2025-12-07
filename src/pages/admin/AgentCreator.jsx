// src/pages/admin/AgentCreator.jsx
import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import { getAllUsers } from "../../services/adminService";
import { createAgent, setUserRole } from "../../services/authService";
import "./AgentCreator.css";

export default function AgentCreator() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: ""
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            // Only show regular users (not already agents or admins)
            const regularUsers = data.filter(u => u.role === 'user');
            setUsers(regularUsers);
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgradeToAgent = async (userId) => {
        if (window.confirm("Are you sure you want to upgrade this user to an agent?")) {
            try {
                await setUserRole(userId, "agent");
                alert("User upgraded to agent successfully!");
                await loadUsers();
            } catch (error) {
                console.error("Error upgrading user:", error);
                alert("Failed to upgrade user: " + error.message);
            }
        }
    };

    const handleCreateAgent = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            alert("Email and password are required");
            return;
        }

        try {
            setCreating(true);
            await createAgent(formData.email, formData.password, formData.name);
            alert("Agent account created successfully!");
            setFormData({ email: "", password: "", name: "" });
            setShowCreateForm(false);
            await loadUsers();
        } catch (error) {
            console.error("Error creating agent:", error);
            alert("Failed to create agent: " + error.message);
        } finally {
            setCreating(false);
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
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Make Agent
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
                    <p className="page-subtitle">Create new agents or upgrade existing users</p>
                </div>
                <button
                    className="create-agent-btn"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    {showCreateForm ? '✕ Cancel' : '+ Create New Agent'}
                </button>
            </div>

            {showCreateForm && (
                <div className="glass-card" style={{ marginBottom: '24px', padding: '24px' }}>
                    <h3 style={{ marginBottom: '16px', color: '#f8fafc' }}>Create New Agent Account</h3>
                    <form onSubmit={handleCreateAgent} style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>
                                Email Address *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                    borderRadius: '8px',
                                    color: '#f8fafc',
                                    fontSize: '14px'
                                }}
                                placeholder="agent@example.com"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>
                                Password *
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                    borderRadius: '8px',
                                    color: '#f8fafc',
                                    fontSize: '14px'
                                }}
                                placeholder="Minimum 6 characters"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>
                                Full Name (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                    borderRadius: '8px',
                                    color: '#f8fafc',
                                    fontSize: '14px'
                                }}
                                placeholder="Agent name"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            style={{
                                padding: '12px',
                                background: creating ? '#64748b' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontWeight: 600,
                                cursor: creating ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            {creating ? 'Creating...' : 'Create Agent Account'}
                        </button>
                    </form>
                </div>
            )}

            <div className="info-box" style={{ marginBottom: '24px' }}>
                <div className="info-icon">ℹ️</div>
                <div>
                    <div className="info-title">Agent Benefits</div>
                    <div className="info-text">Agents earn 40% commission on referred user deposits</div>
                </div>
            </div>

            <h3 style={{ marginBottom: '16px', color: '#f8fafc' }}>Upgrade Existing Users</h3>
            {users.length === 0 ? (
                <div className="empty-state-card glass-card">
                    <div className="empty-icon">👥</div>
                    <h3>No Regular Users</h3>
                    <p>All users are already agents or admins</p>
                </div>
            ) : (
                <DataTable columns={columns} data={users} actions={actions} />
            )}
        </div>
    );
}

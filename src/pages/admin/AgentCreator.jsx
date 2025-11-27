// src/pages/admin/AgentCreator.jsx
import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import { getAllUsers, createAgent } from "../../services/adminService";
import "./AgentCreator.css";

export default function AgentCreator() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleMakeAgent = async (userId) => {
        if (window.confirm("Are you sure you want to upgrade this user to an agent?")) {
            try {
                await createAgent(userId);
                await loadUsers();
            } catch (error) {
                console.error("Error creating agent:", error);
            }
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
            onClick={() => handleMakeAgent(row.id)}
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
                    <h1 className="page-title gradient-text">Create Agent</h1>
                    <p className="page-subtitle">Upgrade users to agent status</p>
                </div>
                <div className="info-box">
                    <div className="info-icon">ℹ️</div>
                    <div>
                        <div className="info-title">Agent Benefits</div>
                        <div className="info-text">Agents earn 10% commission on referred user deposits</div>
                    </div>
                </div>
            </div>

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

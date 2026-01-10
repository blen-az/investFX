import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { getAllAgents, getUsersByReferrer } from "../../services/adminService";
import { setUserRole } from "../../services/authService";
import "./Users.css"; // Re-using Users css for consistency

export default function Agents() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [referredUsers, setReferredUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showUsersModal, setShowUsersModal] = useState(false);

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            setLoading(true);
            const data = await getAllAgents();
            setAgents(data);
        } catch (error) {
            console.error("Error loading agents:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewUsers = async (agent) => {
        setSelectedAgent(agent);
        setShowUsersModal(true);
        try {
            setLoadingUsers(true);
            const users = await getUsersByReferrer(agent.id);
            setReferredUsers(users);
        } catch (error) {
            console.error("Error loading referred users:", error);
            alert("Failed to load referred users");
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleRemoveAgent = async (agent) => {
        if (!window.confirm(`Are you sure you want to remove ${agent.name || agent.email} as an agent?\nThey will become a regular user.`)) {
            return;
        }

        try {
            await setUserRole(agent.id, "user");
            alert("Agent removed successfully. Usage role updated to User.");
            // Refresh list
            loadAgents();
        } catch (error) {
            console.error("Error removing agent:", error);
            alert("Failed to remove agent: " + error.message);
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
                <span className="badge badge-agent">
                    {value}
                </span>
            )
        },
        {
            header: "Commission Balance",
            key: "commissionBalance",
            render: (value) => `$${value?.toFixed(2) || '0.00'}`
        },
        {
            header: "Joined",
            key: "createdAt",
            render: (value) => value ? new Date(value.seconds * 1000).toLocaleDateString() : '-'
        }
    ];

    const userColumns = [
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
        <>
            <button
                className="action-btn"
                style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                onClick={() => handleViewUsers(row)}
            >
                View Users
            </button>
            <button
                className="action-btn"
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', marginLeft: '8px' }}
                onClick={() => handleRemoveAgent(row)}
            >
                Remove
            </button>
        </>
    );

    if (loading) {
        return (
            <div className="users-page">
                <div className="loading-state">Loading agents...</div>
            </div>
        );
    }

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">Agents</h1>
                    <p className="page-subtitle">View all agents and their downlines</p>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total Agents</span>
                        <span className="stat-value">{agents.length}</span>
                    </div>
                </div>
            </div>

            {agents.length === 0 && !loading ? (
                <div className="empty-state-container" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                    <h3>No Agents Found</h3>
                    <p>Use the <a href="/admin/create-agent" style={{ color: '#6366f1', textDecoration: 'underline' }}>Agent Creator</a> to upgrade users to agents.</p>
                </div>
            ) : (
                <DataTable columns={columns} data={agents} actions={actions} />
            )}

            <Modal
                isOpen={showUsersModal}
                onClose={() => setShowUsersModal(false)}
                title={`Users referred by ${selectedAgent?.name || selectedAgent?.email}`}
            >
                <div className="modal-content" style={{ maxWidth: '800px', width: '100%' }}>
                    {loadingUsers ? (
                        <div className="loading-state">Loading users...</div>
                    ) : (
                        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ marginBottom: '16px', color: '#94a3b8' }}>
                                Total Referred Users: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{referredUsers.length}</span>
                            </div>
                            <DataTable columns={userColumns} data={referredUsers} />
                        </div>
                    )}

                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowUsersModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

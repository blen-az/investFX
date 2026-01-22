import React, { useState, useEffect } from 'react';
import AgentLayout from './AgentLayout';
import { useAuth } from "../../contexts/AuthContext";
import DataTable from "../../components/DataTable";
import { getSubAgents } from "../../services/agentService";
import "./Referrals.css"; // Reuse referrals CSS

const AgentsList = () => {
    const { user } = useAuth();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAgents = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await getSubAgents(user.uid);
            setAgents(data);
        } catch (error) {
            console.error("Error loading sub-agents:", error);
        } finally {
            setLoading(false);
        }
    }, [user.uid]);

    useEffect(() => {
        if (user?.uid) {
            loadAgents();
        }
    }, [user, loadAgents]);

    const columns = [
        {
            header: "Agent Name",
            key: "name",
            render: (value, row) => (
                <div>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{value || row.email.split('@')[0]}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{row.email}</div>
                </div>
            )
        },
        {
            header: "Joined",
            key: "createdAt",
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        },
        {
            header: "Status",
            key: "status",
            render: (value) => (
                <span className={`badge badge-success`}>
                    Active
                </span>
            )
        }
    ];

    return (
        <AgentLayout>
            <div className="referrals-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title gradient-text">Agent Management</h1>
                        <p className="page-subtitle">Manage your sub-agents and downlines</p>
                    </div>
                </div>

                <div className="section-header">
                    <h2 className="section-title">My Sub-Agents</h2>
                </div>

                {loading ? (
                    <div className="loading-state">Loading agents...</div>
                ) : agents.length === 0 ? (
                    <div className="empty-state-card glass-card">
                        <div className="empty-icon">👥</div>
                        <h3>No Sub-Agents Yet</h3>
                        <p>When your referrals are promoted to agents, they will appear here.</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={agents} />
                )}
            </div>
        </AgentLayout>
    );
};

export default AgentsList;

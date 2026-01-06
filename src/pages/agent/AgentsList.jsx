import React from 'react';
import AgentLayout from './AgentLayout';

const AgentsList = () => {
    return (
        <AgentLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">Agent Management</h1>
                    <p className="page-subtitle">Manage your sub-agents and downlines</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚧</div>
                <h2>Under Construction</h2>
                <p style={{ color: '#94a3b8' }}>This feature will be available soon.</p>
            </div>
        </AgentLayout>
    );
};

export default AgentsList;

import React from 'react';
import AgentLayout from './AgentLayout';
import { useParams, useLocation } from 'react-router-dom';

const AgentOrderList = () => {
    const { type } = useParams(); // delivery or contract
    const location = useLocation();

    // Determine title based on route
    const isContract = location.pathname.includes('contract');
    const title = isContract ? "Contract Orders" : "Delivery Orders";
    const subtitle = isContract ? "View perpetual contract positions" : "View delivery option trades";

    return (
        <AgentLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">{title}</h1>
                    <p className="page-subtitle">{subtitle}</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📄</div>
                <h2>No Orders Found</h2>
                <p style={{ color: '#94a3b8' }}>Order history for your referrals will appear here.</p>
            </div>
        </AgentLayout>
    );
};

export default AgentOrderList;

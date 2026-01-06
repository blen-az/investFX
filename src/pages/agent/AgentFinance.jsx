import React from 'react';
import AgentLayout from './AgentLayout';
import { useLocation } from 'react-router-dom';

const AgentFinance = () => {
    const location = useLocation();

    // Determine title based on route
    const isDeposit = location.pathname.includes('deposits');
    const title = isDeposit ? "User Deposits" : "User Withdrawals";
    const subtitle = isDeposit ? "Monitor incoming deposits from referrals" : "Track withdrawal requests from referrals";
    const icon = isDeposit ? "💰" : "💸";

    return (
        <AgentLayout>
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">{title}</h1>
                    <p className="page-subtitle">{subtitle}</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>{icon}</div>
                <h2>No {isDeposit ? 'Deposits' : 'Withdrawals'} Found</h2>
                <p style={{ color: '#94a3b8' }}>Transaction history will be displayed here.</p>
            </div>
        </AgentLayout>
    );
};

export default AgentFinance;

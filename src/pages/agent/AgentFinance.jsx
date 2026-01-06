import React, { useState, useEffect } from 'react';
import AgentLayout from './AgentLayout';
import { useAuth } from "../../contexts/AuthContext";
import DataTable from "../../components/DataTable";
import { getAgentDownlineFinance, getReferredUsers } from "../../services/agentService";
import { useLocation } from 'react-router-dom';
import "./Referrals.css";

const AgentFinance = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [referredUsers, setReferredUsers] = useState({});

    const isDeposit = location.pathname.includes('deposits');
    const title = isDeposit ? "User Deposits" : "User Withdrawals";
    const subtitle = isDeposit ? "Monitor incoming deposits from referrals" : "Track withdrawal requests from referrals";
    const icon = isDeposit ? "💰" : "💸";

    useEffect(() => {
        if (user?.uid) {
            loadData();
        }
    }, [user, isDeposit]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Load users to create a map of uid -> email
            const users = await getReferredUsers(user.uid);
            const userMap = {};
            users.forEach(u => {
                userMap[u.id] = u.email;
            });
            setReferredUsers(userMap);

            // 2. Load transactions
            const type = isDeposit ? 'deposit' : 'withdrawal';
            const data = await getAgentDownlineFinance(user.uid, type);
            setTransactions(data);

        } catch (error) {
            console.error("Error loading agent finance:", error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: "User",
            key: "uid",
            render: (value) => (
                <div style={{ fontSize: '13px', color: '#f8fafc' }}>
                    {referredUsers[value] || value}
                </div>
            )
        },
        {
            header: "Amount",
            key: "amount",
            render: (value) => (
                <span style={{
                    color: isDeposit ? '#10b981' : '#f59e0b',
                    fontWeight: 600
                }}>
                    ${value?.toFixed(2)}
                </span>
            )
        },
        {
            header: "Method",
            key: "method",
            render: (value) => (
                <span className="badge badge-info">
                    {value || (isDeposit ? 'Bank Transfer' : 'Crypto')}
                </span>
            )
        },
        {
            header: "Status",
            key: "status",
            render: (value) => {
                let badgeClass = 'warning'; // pending
                if (value === 'approved' || value === 'completed' || value === 'success') badgeClass = 'success';
                if (value === 'rejected' || value === 'failed') badgeClass = 'danger';

                return (
                    <span className={`badge badge-${badgeClass}`}>
                        {value?.toUpperCase()}
                    </span>
                );
            }
        },
        {
            header: "Date",
            key: "createdAt",
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
    ];

    return (
        <AgentLayout>
            <div className="referrals-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title gradient-text">{title}</h1>
                        <p className="page-subtitle">{subtitle}</p>
                    </div>
                </div>

                <div className="section-header">
                    <h2 className="section-title">Downline {isDeposit ? 'Deposits' : 'Withdrawals'}</h2>
                </div>

                {loading ? (
                    <div className="loading-state">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <div className="empty-state-card glass-card">
                        <div className="empty-icon">{icon}</div>
                        <h3>No Transactions Found</h3>
                        <p>No {isDeposit ? 'deposits' : 'withdrawals'} found from your downline.</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={transactions} />
                )}
            </div>
        </AgentLayout>
    );
};

export default AgentFinance;

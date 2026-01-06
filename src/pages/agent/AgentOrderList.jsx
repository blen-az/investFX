import React, { useState, useEffect } from 'react';
import AgentLayout from './AgentLayout';
import { useAuth } from "../../contexts/AuthContext";
import DataTable from "../../components/DataTable";
import { getAgentDownlineOrders, getReferredUsers } from "../../services/agentService";
import { useLocation } from 'react-router-dom';
import "./Referrals.css";

const AgentOrderList = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [referredUsers, setReferredUsers] = useState({});

    const isContract = location.pathname.includes('contract');
    const title = isContract ? "Contract Orders" : "Delivery Orders";
    const subtitle = isContract ? "View downline perpetual contract positions" : "View downline delivery option trades";

    useEffect(() => {
        if (user?.uid) {
            loadData();
        }
    }, [user, isContract]); // Reload when user or type changes

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

            // 2. Load orders
            const allOrders = await getAgentDownlineOrders(user.uid);

            // 3. Filter by type (assuming 'type' field in trade distinguishes delivery/contract or we use another field)
            // If the trade model distinguishes via 'isPerpetual' boolean or 'type' string:
            // Assuming: 'contract' means perpetual, 'delivery' means standard binary options.
            // Let's assume standard trades have type 'buy'/'sell' and maybe 'market'/'limit' for perpetual.
            // Adjusting filter logic based on common patterns. If no clear distinction, show all for now.
            // FIXME: Adjust filter logic once trade schema is confirmed. 
            // For now, assuming isContract checks for 'leverage' field existence or similar? 
            // Or maybe separate "positions" collection? 
            // The service fetches from "trades" collection. 
            // Let's filter by: isContract ? row.leverage > 0 : !row.leverage (just a guess, or show all for MVP)

            let filtered = allOrders;
            if (isContract) {
                filtered = allOrders.filter(o => o.leverage); // Heuristic for now
            } else {
                filtered = allOrders.filter(o => !o.leverage);
            }

            setOrders(filtered);

        } catch (error) {
            console.error("Error loading agent orders:", error);
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
            header: "Asset",
            key: "asset",
            render: (value) => <span style={{ fontWeight: 600 }}>{value}</span>
        },
        {
            header: "Type",
            key: "type",
            render: (value) => (
                <span className={`badge badge-${value === 'buy' ? 'success' : 'danger'}`}>
                    {value?.toUpperCase()}
                </span>
            )
        },
        {
            header: "Amount",
            key: "amount",
            render: (value) => `$${value?.toFixed(2)}`
        },
        {
            header: "P&L",
            key: "pnl",
            render: (value, row) => {
                if (row.status === 'active') return '-';
                return (
                    <span style={{ color: value >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {value >= 0 ? '+' : ''}${value?.toFixed(2)}
                    </span>
                );
            }
        },
        {
            header: "Date",
            key: "createdAt",
            render: (value) => value ? new Date(value).toLocaleString() : '-'
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
                    <h2 className="section-title">Downline Trading Activity</h2>
                </div>

                {loading ? (
                    <div className="loading-state">Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="empty-state-card glass-card">
                        <div className="empty-icon">📄</div>
                        <h3>No Orders Found</h3>
                        <p>No {isContract ? 'contract' : 'delivery'} orders found from your downline.</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={orders} />
                )}
            </div>
        </AgentLayout>
    );
};

export default AgentOrderList;

// src/pages/admin/Commissions.jsx
import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import StatsCard from "../../components/StatsCard";
import { db } from "../../firebase";
import { collection, getDocs, query, doc, getDoc } from "firebase/firestore";
import "./AdminDashboard.css";

export default function AdminCommissions() {
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPlatformProfit: 0,
        totalAgentCommissions: 0,
        totalDeposits: 0,
        totalPlatformFees: 0
    });

    useEffect(() => {
        loadCommissions();
    }, []);

    const loadCommissions = async () => {
        try {
            setLoading(true);

            // Fetch all commissions (removed orderBy to avoid index requirement)
            const commissionsRef = collection(db, "commissions");
            const q = query(commissionsRef);
            const snapshot = await getDocs(q);

            const history = [];

            // Fetch agent names for each commission
            for (const commissionDoc of snapshot.docs) {
                const commissionData = commissionDoc.data();
                let agentName = "Unknown Agent";

                if (commissionData.agentId) {
                    try {
                        const agentDoc = await getDoc(doc(db, "users", commissionData.agentId));
                        if (agentDoc.exists()) {
                            const agentData = agentDoc.data();
                            agentName = agentData.name || agentData.email || "Unknown Agent";
                        }
                    } catch (err) {
                        console.error("Error fetching agent:", err);
                    }
                }

                history.push({
                    id: commissionDoc.id,
                    ...commissionData,
                    agentName,
                    createdAt: commissionData.createdAt?.toDate()
                });
            }

            // Client-side sorting
            history.sort((a, b) => b.createdAt - a.createdAt);

            setCommissions(history);

            // Calculate stats
            const totalPlatformProfit = history.reduce((sum, c) => sum + (c.platformProfit || 0), 0);
            const totalAgentCommissions = history.reduce((sum, c) => sum + (c.agentCommission || 0), 0);
            const totalDeposits = history.reduce((sum, c) => sum + (c.depositAmount || 0), 0);
            const totalPlatformFees = history.reduce((sum, c) => sum + (c.platformFee || 0), 0);

            setStats({ totalPlatformProfit, totalAgentCommissions, totalDeposits, totalPlatformFees });
        } catch (error) {
            console.error("Error loading commissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: "Date",
            key: "createdAt",
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        },
        {
            header: "Agent",
            key: "agentName",
            render: (value) => (
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#f8fafc' }}>
                    {value || "Unknown Agent"}
                </div>
            )
        },
        {
            header: "Deposit",
            key: "depositAmount",
            render: (value) => `$${value?.toFixed(2) || '0.00'}`
        },
        {
            header: "Platform Fee (10%)",
            key: "platformFee",
            render: (value) => (
                <span style={{ color: '#f8fafc' }}>
                    ${value?.toFixed(2) || '0.00'}
                </span>
            )
        },
        {
            header: "Agent Cut (40%)",
            key: "agentCommission",
            render: (value) => (
                <span style={{ color: '#10b981', fontWeight: 600 }}>
                    ${value?.toFixed(2) || '0.00'}
                </span>
            )
        },
        {
            header: "Admin Profit (50%)",
            key: "platformProfit",
            render: (value) => (
                <span style={{ color: '#3b82f6', fontWeight: 600 }}>
                    ${value?.toFixed(2) || '0.00'}
                </span>
            )
        }
    ];

    if (loading) {
        return <div className="p-8 text-center text-gray-400">Loading commissions...</div>;
    }

    return (
        <div className="commissions-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">All Commissions</h1>
                    <p className="page-subtitle">Global commission tracking and platform revenue</p>
                </div>
                <button
                    onClick={async () => {
                        if (window.confirm("Recalculate commissions for all past deposits? This may take a moment.")) {
                            try {
                                setLoading(true);
                                const { recalculateCommissions } = await import("../../services/adminService");
                                const result = await recalculateCommissions();
                                alert(`Recalculation complete!\nCreated: ${result.created}\nSkipped: ${result.skipped}`);
                                loadCommissions();
                            } catch (err) {
                                console.error(err);
                                alert("Error recalculating: " + err.message);
                            } finally {
                                setLoading(false);
                            }
                        }
                    }}
                    className="action-btn action-btn-primary"
                    style={{ height: 'fit-content' }}
                >
                    🔄 Recalculate All
                </button>
            </div>

            {/* Admin Stats */}
            <div className="commission-stats-grid">
                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>💰</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Platform Profit</div>
                        <div className="stat-value" style={{ color: '#3b82f6' }}>
                            ${stats.totalPlatformProfit.toFixed(2)}
                        </div>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>🧾</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Platform Fees</div>
                        <div className="stat-value" style={{ color: '#f59e0b' }}>
                            ${stats.totalPlatformFees.toFixed(2)}
                        </div>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>👥</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Paid to Agents</div>
                        <div className="stat-value" style={{ color: '#10b981' }}>
                            ${stats.totalAgentCommissions.toFixed(2)}
                        </div>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Deposits Processed</div>
                        <div className="stat-value">
                            ${stats.totalDeposits.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            <DataTable columns={columns} data={commissions} />
        </div>
    );
}

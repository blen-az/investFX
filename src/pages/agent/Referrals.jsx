import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DataTable from "../../components/DataTable";
import { getReferredUsers, generateReferralLink, getAgentReferralCode } from "../../services/agentService";
import "./Referrals.css";

export default function Referrals() {
    const { user } = useAuth();
    const [referredUsers, setReferredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [referralLink, setReferralLink] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            loadAgentData();
        }
    }, [user]);

    const loadAgentData = async () => {
        try {
            setLoading(true);
            // Get referral code first
            const code = await getAgentReferralCode(user.uid);
            if (code) {
                const link = generateReferralLink(code);
                setReferralLink(link);
            }
            // Then load referred users
            const referred = await getReferredUsers(user.uid);
            setReferredUsers(referred);
        } catch (error) {
            console.error("Error loading agent data:", error);
        } finally {
            setLoading(false);
        }
    };


    const copyReferralLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
            header: "Status",
            key: "frozen",
            render: (value) => (
                <span className={`badge ${value ? 'badge-danger' : 'badge-success'}`}>
                    {value ? 'Frozen' : 'Active'}
                </span>
            )
        },
        {
            header: "Joined",
            key: "createdAt",
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
    ];

    if (loading) {
        return (
            <div className="referrals-page">
                <div className="loading-state">Loading referrals...</div>
            </div>
        );
    }

    return (
        <div className="referrals-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">My Referrals</h1>
                    <p className="page-subtitle">Users you've referred to the platform</p>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total Referrals</span>
                        <span className="stat-value">{referredUsers.length}</span>
                    </div>
                </div>
            </div>

            {/* Referral Link Card */}
            <div className="referral-card glass-card">
                <div className="referral-header">
                    <div className="referral-icon">🔗</div>
                    <div>
                        <h2 className="referral-title">Your Referral Link</h2>
                        <p className="referral-subtitle">Share this link to earn 40% commission</p>
                    </div>
                </div>

                <div className="referral-link-box">
                    <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="referral-input"
                    />
                    <button onClick={copyReferralLink} className="copy-btn">
                        {copied ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.6018 3.08839C16.2171 2.71211 15.7016 2.5 15.1634 2.5H10C8.89543 2.5 8 3.39543 8 4.5V4Z" stroke="currentColor" strokeWidth="2" />
                                    <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Copy
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Referred Users Table */}
            <div className="section-header">
                <h2 className="section-title">Referred Users</h2>
            </div>

            {referredUsers.length === 0 ? (
                <div className="empty-state-card glass-card">
                    <div className="empty-icon">👥</div>
                    <h3>No Referrals Yet</h3>
                    <p>Share your referral link to start earning commissions</p>
                    <button onClick={copyReferralLink} className="btn btn-primary" style={{ marginTop: '16px' }}>
                        Copy Referral Link
                    </button>
                </div>
            ) : (
                <DataTable columns={columns} data={referredUsers} />
            )}
        </div>
    );
}

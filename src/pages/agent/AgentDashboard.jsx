// src/pages/agent/AgentDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import StatsCard from "../../components/StatsCard";
import { generateReferralLink } from "../../services/agentService";
import "./AgentDashboard.css";

export default function AgentDashboard() {
    const { user } = useAuth();
    const [referralLink, setReferralLink] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (user) {
            const link = generateReferralLink(user.uid);
            setReferralLink(link);
        }
    }, [user]);

    const copyReferralLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="agent-dashboard">
            <div className="agent-header">
                <div>
                    <h1 className="agent-title gradient-text">Agent Dashboard</h1>
                    <p className="agent-subtitle">Welcome back, {user?.email}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatsCard
                    icon="👥"
                    label="Total Referrals"
                    value="0"
                    color="cyan"
                />
                <StatsCard
                    icon="💰"
                    label="Total Commissions"
                    value="$0.00"
                    color="green"
                />
                <StatsCard
                    icon="📊"
                    label="This Month"
                    value="$0.00"
                    color="blue"
                />
                <StatsCard
                    icon="⏳"
                    label="Pending"
                    value="$0.00"
                    color="yellow"
                />
            </div>

            {/* Referral Link Card */}
            <div className="referral-card glass-card">
                <div className="referral-header">
                    <div className="referral-icon">🔗</div>
                    <div>
                        <h2 className="referral-title">Your Referral Link</h2>
                        <p className="referral-subtitle">Share this link to earn 10% commission on deposits</p>
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

            {/* Quick Actions */}
            <div className="agent-quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="action-grid">
                    <a href="/agent/referrals" className="action-card glass-card">
                        <div className="action-icon">👥</div>
                        <div className="action-title">View Referrals</div>
                        <div className="action-desc">See all users you've referred</div>
                    </a>

                    <a href="/agent/commissions" className="action-card glass-card">
                        <div className="action-icon">💰</div>
                        <div className="action-title">Commission History</div>
                        <div className="action-desc">Track your earnings</div>
                    </a>

                    <div className="action-card glass-card" onClick={copyReferralLink}>
                        <div className="action-icon">📋</div>
                        <div className="action-title">Copy Link</div>
                        <div className="action-desc">Quick copy referral link</div>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="info-card glass-card">
                <div className="info-icon">ℹ️</div>
                <div className="info-content">
                    <h3 className="info-title">How It Works</h3>
                    <ul className="info-list">
                        <li>Share your referral link with friends</li>
                        <li>They sign up using your link</li>
                        <li>When they make a deposit, you earn 10% commission</li>
                        <li>Commissions are added to your balance automatically</li>
                        <li>Withdraw your earnings anytime</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

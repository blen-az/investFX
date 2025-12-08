// src/pages/agent/AgentDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import StatsCard from "../../components/StatsCard";
import { generateReferralLink, getAgentStats, getAgentReferralCode } from "../../services/agentService";
import "./AgentDashboard.css";

export default function AgentDashboard() {
    const { user } = useAuth();
    const [referralCode, setReferralCode] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [loadingCode, setLoadingCode] = useState(true);
    const [codeError, setCodeError] = useState("");
    const [stats, setStats] = useState({
        totalReferrals: 0,
        totalCommissions: 0,
        thisMonthCommissions: 0,
        commissionBalance: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (user?.uid) {
                try {
                    setLoading(true);
                    setLoadingCode(true);
                    setCodeError("");

                    // Fetch referral code
                    const code = await getAgentReferralCode(user.uid);
                    if (code) {
                        setReferralCode(code);
                        const link = generateReferralLink(code);
                        setReferralLink(link);
                    } else {
                        setCodeError("No referral code found. Please contact admin to generate one.");
                    }

                    // Fetch stats
                    const agentStats = await getAgentStats(user.uid);
                    setStats(agentStats);
                } catch (error) {
                    console.error("Error loading agent data:", error);
                    setCodeError("Failed to load referral code");
                } finally {
                    setLoading(false);
                    setLoadingCode(false);
                }
            }
        };
        loadData();
    }, [user]);

    const copyReferralLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyReferralCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
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
                    value={loading ? "..." : stats.totalReferrals.toString()}
                    color="cyan"
                />
                <StatsCard
                    icon="💰"
                    label="Total Commissions"
                    value={loading ? "..." : `$${stats.totalCommissions.toFixed(2)}`}
                    color="green"
                />
                <StatsCard
                    icon="📊"
                    label="This Month"
                    value={loading ? "..." : `$${stats.thisMonthCommissions.toFixed(2)}`}
                    color="blue"
                />
                <StatsCard
                    icon="⏳"
                    label="Available Balance"
                    value={loading ? "..." : `$${stats.commissionBalance.toFixed(2)}`}
                    color="yellow"
                />
            </div>

            {/* Referral Code Card */}
            <div className="referral-card glass-card" style={{ marginBottom: '20px' }}>
                <div className="referral-header">
                    <div className="referral-icon">🎯</div>
                    <div>
                        <h2 className="referral-title">Your Referral Code</h2>
                        <p className="referral-subtitle">Share this code with potential signups</p>
                    </div>
                </div>

                <div className="referral-code-display" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    background: 'rgba(6, 182, 212, 0.1)',
                    borderRadius: '12px',
                    border: '2px solid rgba(6, 182, 212, 0.3)'
                }}>
                    <div style={{
                        flex: 1,
                        fontSize: '2rem',
                        fontWeight: '900',
                        fontFamily: 'monospace',
                        color: loadingCode ? '#94a3b8' : codeError ? '#ef4444' : '#06b6d4',
                        textAlign: 'center',
                        letterSpacing: '4px'
                    }}>
                        {loadingCode ? "LOADING..." : codeError ? "NO CODE" : (referralCode || "NO CODE")}
                    </div>
                    {!loadingCode && !codeError && referralCode && (
                        <button onClick={copyReferralCode} className="copy-btn">
                            {copiedCode ? (
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
                                    Copy Code
                                </>
                            )}
                        </button>
                    )}
                </div>
                {codeError && (
                    <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        {codeError}
                    </div>
                )}
            </div>

            {/* Referral Link Card */}
            <div className="referral-card glass-card">
                <div className="referral-header">
                    <div className="referral-icon">🔗</div>
                    <div>
                        <h2 className="referral-title">Your Referral Link</h2>
                        <p className="referral-subtitle">Share this link to earn 40% commission on deposits</p>
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
            <div className="action-icon">📋</div>
            <div className="action-title">Copy Link</div>
            <div className="action-desc">Quick copy referral link</div>
        </div>
                </div >
            </div >

        {/* Info Card */ }
        < div className = "info-card glass-card" >
                <div className="info-icon">ℹ️</div>
                <div className="info-content">
                    <h3 className="info-title">How It Works</h3>
                    <ul className="info-list">
                        <li>Share your referral link with friends</li>
                        <li>They sign up using your link</li>
                        <li>When they make a deposit, you earn 40% commission</li>
                        <li>Commissions are added to your balance automatically</li>
                        <li>Withdraw your earnings anytime</li>
                    </ul>
                </div>
            </div >
        </div >
    );
}

// src/pages/agent/AgentDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import StatsCard from "../../components/StatsCard";
import { generateReferralLink, getAgentStats, getAgentReferralCode } from "../../services/agentService";
import AgentLayout from "./AgentLayout";
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

                setLoading(true);
                setLoadingCode(true);
                setCodeError("");

                // 1. Fetch referral code independently
                try {
                    const code = await getAgentReferralCode(user.uid);
                    if (code) {
                        setReferralCode(code);
                        const link = generateReferralLink(code);
                        setReferralLink(link);
                    } else {
                        setCodeError("No referral code found. Please contact admin to generate one.");
                    }
                } catch (codeErr) {
                    console.error("Error loading referral code:", codeErr);
                    setCodeError(`Failed to load referral code: ${codeErr.message}`);
                } finally {
                    setLoadingCode(false);
                }

                // 2. Fetch stats independently
                try {
                    const agentStats = await getAgentStats(user.uid);
                    setStats(agentStats);
                } catch (statsErr) {
                    console.error("Error loading agent stats:", statsErr);
                    // We don't block the UI for this, just log it. 
                    // Optionally set a specialized error state for stats if needed.
                } finally {
                    setLoading(false);
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
        <AgentLayout>
            <div className="agent-dashboard">
                <div className="agent-header">
                    <div>
                        <h1 className="agent-title">Overview</h1>
                        <div className="agent-welcome-box">
                            <p className="agent-subtitle">Welcome back, {user?.displayName || user?.email}</p>
                            <span className="agent-id">ID: {user?.uid}</span>
                        </div>
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
                <div className="dashboard-grid">
                    <div className="referral-card glass-card">
                        <div className="referral-header">
                            <div className="referral-icon">🎯</div>
                            <div>
                                <h2 className="referral-title">Your Referral Code</h2>
                                <p className="referral-subtitle">Share this code with potential signups</p>
                            </div>
                        </div>

                        <div className="referral-code-display">
                            <div className="code-text">
                                {loadingCode ? "..." : codeError ? "ERROR" : (referralCode || "NO CODE")}
                            </div>
                            {!loadingCode && !codeError && referralCode && (
                                <button onClick={copyReferralCode} className="copy-btn">
                                    {copiedCode ? "Copied!" : "Copy Code"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Referral Link Card */}
                    <div className="referral-card glass-card">
                        <div className="referral-header">
                            <div className="referral-icon">🔗</div>
                            <div>
                                <h2 className="referral-title">Your Referral Link</h2>
                                <p className="referral-subtitle">Share this link to earn 4% commission</p>
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
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="info-card glass-card">
                    <div className="info-icon">ℹ️</div>
                    <div className="info-content">
                        <h3 className="info-title">Commission System</h3>
                        <ul className="info-list">
                            <li>Share your referral link with friends</li>
                            <li>They sign up using your link</li>
                            <li>When they make a deposit, you earn 4% commission</li>
                            <li>Commissions are added to your balance automatically</li>
                            <li>Withdraw your earnings anytime</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AgentLayout>
    );
}

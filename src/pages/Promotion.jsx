// src/pages/Promotion.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserReferralCode, getReferralStats } from '../services/referralService';
import './Promotion.css';

export default function Promotion() {
    const { user } = useAuth();
    const [referralCode, setReferralCode] = useState('');
    const [referralStats, setReferralStats] = useState({
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadReferralData = async () => {
            try {
                setLoading(true);
                const code = await getUserReferralCode(user.uid);
                const stats = await getReferralStats(user.uid);

                setReferralCode(code);
                setReferralStats(stats);
            } catch (error) {
                console.error('Error loading referral data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadReferralData();
    }, [user]);

    const shareReferral = () => {
        const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;
        if (navigator.share) {
            navigator.share({
                title: 'Join AvaTrade',
                text: 'Start trading with AvaTrade using my referral code!',
                url: referralLink
            });
        } else {
            navigator.clipboard.writeText(referralLink);
            alert('Referral link copied to clipboard!');
        }
    };

    return (
        <div className="promotion-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>My Promotion</h1>
            </div>

            <div className="promotion-container">
                {loading ? (
                    <div className="loading-state">Loading...</div>
                ) : (
                    <>
                        <div className="referral-code-card">
                            <h3>Your Referral Code</h3>
                            <div className="code-display">{referralCode}</div>
                            <button className="share-button" onClick={shareReferral}>
                                Share Referral Link
                            </button>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value">{referralStats.totalReferrals}</div>
                                <div className="stat-label">Total Referrals</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{referralStats.activeReferrals}</div>
                                <div className="stat-label">Active</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">${referralStats.totalEarnings.toFixed(2)}</div>
                                <div className="stat-label">Total Earnings</div>
                            </div>
                        </div>

                        <div className="info-card">
                            <h3>🎁 How it Works</h3>
                            <ul>
                                <li>Share your referral code with friends</li>
                                <li>Earn 10% commission on their trades</li>
                                <li>Get instant payouts to your account</li>
                                <li>No limit on earnings!</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

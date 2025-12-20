import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './SecurityCenter.css';

export default function SecurityCenter() {
    const { user } = useAuth();
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [kycStatus, setKycStatus] = useState("unverified");

    React.useEffect(() => {
        if (!user?.uid) return;
        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                const status = userData.verification?.status || userData.kycStatus || "unverified";
                setKycStatus(status);
            }
        });
        return () => unsub();
    }, [user]);

    const calculateScore = () => {
        let score = 40; // Base score
        if (user?.emailVerified) score += 30;
        if (kycStatus === "verified") score += 20;
        if (twoFactorEnabled) score += 10;
        return score;
    };

    const securityScore = calculateScore();

    const securityItems = [
        { title: 'Email Verification', subtitle: user?.emailVerified ? 'Verified' : 'Unverified', icon: '📧', link: '/settings?tab=account' },
        { title: 'Identity Verification (KYC)', subtitle: kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1), icon: '🆔', link: '/profile?tab=kyc' },
        { title: 'Two-Factor Authentication', subtitle: twoFactorEnabled ? 'Enabled' : 'Disabled', icon: '🔐', action: () => setTwoFactorEnabled(!twoFactorEnabled) },
        { title: 'Change Password', subtitle: 'Secure your account', icon: '🔑', link: '/settings?tab=account' },
    ];

    return (
        <div className="security-center-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>Security Center</h1>
            </div>

            <div className="security-container">
                <div className="security-score">
                    <div className="score-circle">
                        <div className="score-value">{securityScore}</div>
                        <div className="score-label">Security Score</div>
                    </div>
                    <p>{securityScore >= 90 ? 'Your account security is excellent' : securityScore >= 70 ? 'Your account security is strong' : 'Improve your security score'}</p>
                </div>

                <div className="security-items">
                    {securityItems.map((item, idx) => (
                        item.link ? (
                            <Link key={idx} to={item.link} className="security-item">
                                <div className="item-left">
                                    <span className="item-icon">{item.icon}</span>
                                    <div>
                                        <div className="item-title">{item.title}</div>
                                        <div className="item-subtitle">{item.subtitle}</div>
                                    </div>
                                </div>
                                <span className="item-arrow">›</span>
                            </Link>
                        ) : (
                            <div key={idx} className="security-item" onClick={item.action}>
                                <div className="item-left">
                                    <span className="item-icon">{item.icon}</span>
                                    <div>
                                        <div className="item-title">{item.title}</div>
                                        <div className="item-subtitle">{item.subtitle}</div>
                                    </div>
                                </div>
                                <label className="toggle">
                                    <input type="checkbox" checked={twoFactorEnabled} onChange={item.action} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
}

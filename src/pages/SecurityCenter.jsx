// src/pages/SecurityCenter.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './SecurityCenter.css';

export default function SecurityCenter() {
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    const securityItems = [
        { title: 'Two-Factor Authentication', subtitle: twoFactorEnabled ? 'Enabled' : 'Disabled', icon: '🔐', action: () => setTwoFactorEnabled(!twoFactorEnabled) },
        { title: 'Change Password', subtitle: 'Last changed 30 days ago', icon: '🔑', link: '/change-password' },
        { title: 'Login History', subtitle: 'View recent logins', icon: '📝', link: '/login-history' },
        { title: 'Trusted Devices', subtitle: '3 devices', icon: '📱', link: '/trusted-devices' },
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
                        <div className="score-value">85</div>
                        <div className="score-label">Security Score</div>
                    </div>
                    <p>Your account security is strong</p>
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

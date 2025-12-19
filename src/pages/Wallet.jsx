// src/pages/Wallet.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './Wallet.css';

export default function Wallet() {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [kycStatus, setKycStatus] = useState("unverified");
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [stats, setStats] = useState({
        todayPL: 0,
        totalTrades: 0,
        winRate: 0
    });

    useEffect(() => {
        if (!user) return;

        // Subscribe to Wallet
        const unsubscribeWallet = onSnapshot(doc(db, 'wallets', user.uid), (doc) => {
            if (doc.exists()) {
                setBalance(doc.data().balance || 0);
            }
        });

        // Subscribe to User Info
        const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                const status = userData.verification?.status || userData.kycStatus || "unverified";
                setKycStatus(status);
            }
        });

        // Subscribe to Trades for Stats
        const tradesQuery = query(
            collection(db, 'trades'),
            where('uid', '==', user.uid)
        );

        const unsubscribeTrades = onSnapshot(tradesQuery, (snapshot) => {
            const tradesData = snapshot.docs.map(doc => ({
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            // Total Trades
            const total = tradesData.length;

            // Win Rate
            const closedTrades = tradesData.filter(t => t.status === 'closed');
            const wins = closedTrades.filter(t => t.result === 'win').length;
            const rate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;

            // Today's P&L
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const todayTrades = tradesData.filter(t => t.createdAt >= startOfToday);
            const pnl = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

            setStats({
                todayPL: pnl,
                totalTrades: total,
                winRate: rate
            });
        });

        return () => {
            unsubscribeWallet();
            unsubscribeUser();
            unsubscribeTrades();
        };
    }, [user]);

    const getBadge = () => {
        if (kycStatus === "verified") return <span className="status-badge verified">Verified</span>;
        if (kycStatus === "pending") return <span className="status-badge pending">In Review</span>;
        return (
            <Link to="/profile?tab=kyc" className="status-badge unverified-link">
                Verify Now
            </Link>
        );
    };

    const menuSections = [
        {
            title: null, // Financial operations without header
            items: [
                { label: 'Deposit', path: '/deposit', icon: '💳' },
                { label: 'Withdrawal', path: '/withdraw', icon: '💸' },
                { label: 'Account transfer', path: '/account-transfer', icon: '🔄' },
                { label: 'Exchange', path: '/exchange', icon: '💱' },
            ]
        },
        {
            title: 'Accounts',
            items: [
                { label: 'My promotion', path: '/promotion', icon: '🎁' },
                { label: 'Security Center', path: '/security', icon: '🔒' },
                { label: 'Bind the withdrawal address', path: '/withdrawal-address', icon: '🏦' },
                { label: 'Fiat money collection method', path: '/payment-methods', icon: '💰' },
            ]
        },
        {
            title: 'Universal',
            items: [
                { label: 'Settings & Profile', path: '/profile', icon: '⚙️' },
                { label: 'Night Mode', path: null, icon: '🌙', toggle: true },
                { label: 'Download app', path: '/download-app', icon: '📱' },
                { label: 'Regulatory Information', path: '/regulatory-info', icon: '📋' },
            ]
        }
    ];

    return (
        <div className="wallet-page">
            {/* User Header */}
            <div className="mine-user-header">
                <div className="user-avatar-main">
                    {(user?.email || "U")[0].toUpperCase()}
                </div>
                <div className="user-info-text">
                    <div className="user-email-row">
                        <span className="user-name">{user?.email ? user.email.split("@")[0] : "Trader"}</span>
                        {getBadge()}
                    </div>
                    <div className="user-full-email">{user?.email}</div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="mine-stats-grid">
                <div className="mine-stat-card">
                    <div className="mine-stat-label">Portfolio</div>
                    <div className="mine-stat-value">
                        {balanceHidden ? '****' : `$${balance.toLocaleString()}`}
                        <button className="small-toggle" onClick={() => setBalanceHidden(!balanceHidden)}>
                            {balanceHidden ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                </div>
                <div className="mine-stat-card">
                    <div className="mine-stat-label">Today's P&L</div>
                    <div className={`mine-stat-value ${stats.todayPL >= 0 ? 'positive' : 'negative'}`}>
                        {stats.todayPL >= 0 ? '+' : ''}${stats.todayPL.toFixed(2)}
                    </div>
                </div>
                <div className="mine-stat-card">
                    <div className="mine-stat-label">Trades</div>
                    <div className="mine-stat-value">{stats.totalTrades}</div>
                </div>
                <div className="mine-stat-card">
                    <div className="mine-stat-label">Win Rate</div>
                    <div className="mine-stat-value accent">{stats.winRate}%</div>
                </div>
            </div>

            {/* Menu Sections */}
            {menuSections.map((section, idx) => (
                <div key={idx} className="wallet-section">
                    {section.title && <div className="wallet-section-title">{section.title}</div>}

                    <div className="wallet-menu-items">
                        {section.items.map((item, itemIdx) => (
                            item.toggle ? (
                                <div key={itemIdx} className="wallet-menu-item">
                                    <div className="menu-item-left">
                                        <span className="menu-item-icon">{item.icon}</span>
                                        <span className="menu-item-label">{item.label}</span>
                                    </div>
                                    <label className="night-mode-toggle">
                                        <input type="checkbox" />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            ) : (
                                <Link
                                    key={itemIdx}
                                    to={item.path}
                                    className="wallet-menu-item"
                                >
                                    <div className="menu-item-left">
                                        <span className="menu-item-icon">{item.icon}</span>
                                        <span className="menu-item-label">{item.label}</span>
                                    </div>
                                    <span className="menu-item-arrow">›</span>
                                </Link>
                            )
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

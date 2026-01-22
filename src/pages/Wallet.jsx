// src/pages/Wallet.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './Wallet.css';

export default function Wallet() {
    const { user } = useAuth();
    const [balances, setBalances] = useState({
        funding: 0,
        spot: 0,
        futures: 0,
        earn: 0,
        contract: 0,
        fiat: 0,
        commission: 0
    });
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
                const data = doc.data();
                // Migration logic: if new fields don't exist, use the old names or defaults
                setBalances({
                    funding: data.mainBalance !== undefined ? data.mainBalance : (data.balance || 0),
                    spot: data.spotBalance || 0,
                    futures: data.tradingBalance !== undefined ? data.tradingBalance : 0,
                    earn: data.earnBalance || 0,
                    contract: data.contractBalance || 0,
                    fiat: data.fiatBalance || 0,
                    commission: data.commissionBalance || 0
                });
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
                { label: 'Regulatory Information', path: '/regulatory-info', icon: '📋' },
            ]
        }
    ];

    return (
        <div className="wallet-page">
            {/* Balances Section */}
            <div className="mine-stats-grid balance-section">
                <div className="mine-stat-card full-width">
                    <div className="balance-header">
                        <div className="mine-stat-label">TOTAL ASSETS</div>
                        <button className="small-toggle" onClick={() => setBalanceHidden(!balanceHidden)}>
                            {balanceHidden ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    <div className="mine-stat-value total">
                        {balanceHidden ? '****' : `$${(balances.funding + balances.spot + balances.futures + balances.earn + balances.contract + balances.fiat + balances.commission).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </div>
                </div>

                <div className="wallet-types-grid">
                    <div className="mine-stat-card">
                        <div className="mine-stat-label">Funding</div>
                        <div className="mine-stat-value secondary">
                            {balanceHidden ? '****' : `$${balances.funding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </div>
                    </div>
                    <div className="mine-stat-card">
                        <div className="mine-stat-label">Spot</div>
                        <div className="mine-stat-value secondary">
                            {balanceHidden ? '****' : `$${balances.spot.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </div>
                    </div>
                    <div className="mine-stat-card">
                        <div className="mine-stat-label">Futures</div>
                        <div className="mine-stat-value secondary">
                            {balanceHidden ? '****' : `$${balances.futures.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </div>
                    </div>
                    <div className="mine-stat-card">
                        <div className="mine-stat-label">Earn</div>
                        <div className="mine-stat-value secondary">
                            {balanceHidden ? '****' : `$${balances.earn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </div>
                    </div>
                    <div className="mine-stat-card">
                        <div className="mine-stat-label">Contract</div>
                        <div className="mine-stat-value secondary">
                            {balanceHidden ? '****' : `$${balances.contract.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </div>
                    </div>
                    <div className="mine-stat-card">
                        <div className="mine-stat-label">Fiat</div>
                        <div className="mine-stat-value secondary">
                            {balanceHidden ? '****' : `$${balances.fiat.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </div>
                    </div>
                </div>

                {balances.commission > 0 && (
                    <div className="mine-stat-card full-width commission-card">
                        <div className="mine-stat-label">Agent Commission</div>
                        <div className="mine-stat-value accent">
                            {balanceHidden ? '****' : `$${balances.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </div>
                    </div>
                )}
            </div>

            {/* Trading Performance Section */}
            <div className="section-title-small">TRADING PERFORMANCE</div>
            <div className="mine-stats-grid">
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

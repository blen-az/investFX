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
    const [balanceHidden, setBalanceHidden] = useState(false);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                setBalance(doc.data().balance || 0);
            }
        });

        return () => unsubscribe();
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
                { label: 'Night Mode', path: null, icon: '🌙', toggle: true },
                { label: 'Download app', path: '/download-app', icon: '📱' },
                { label: 'Regulatory Information', path: '/regulatory-info', icon: '📋' },
            ]
        }
    ];

    return (
        <div className="wallet-page">
            {/* Balance Card */}
            <div className="wallet-balance-card">
                <div className="balance-amount-large">
                    {balanceHidden ? '********' : balance.toFixed(2)}
                </div>
                <div className="balance-available">
                    <span>Available: {balanceHidden ? '********' : balance.toFixed(2)}</span>
                    <button
                        className="balance-visibility-toggle"
                        onClick={() => setBalanceHidden(!balanceHidden)}
                    >
                        →
                    </button>
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

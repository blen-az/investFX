import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './Assets.css';

export default function Assets() {
    const { user } = useAuth();
    const [assets, setAssets] = useState({});
    const [loading, setLoading] = useState(true);
    const [totalEstimated, setTotalEstimated] = useState(0);
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = onSnapshot(doc(db, 'wallets', user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const userAssets = data.assets || {
                    USDT: { name: 'Tether', symbol: 'USDT', total: data.mainBalance || data.balance || 0, networks: { "TRC20": data.mainBalance || data.balance || 0 } },
                    BTC: { name: 'Bitcoin', symbol: 'BTC', total: 0, networks: { "Bitcoin": 0 } },
                    ETH: { name: 'Ethereum', symbol: 'ETH', total: 0, networks: { "Ethereum": 0 } },
                };
                setAssets(userAssets);

                // Calculate total estimated value (simple USD 1:1 for USDT for now)
                // In production, you'd fetch prices for BTC/ETH
                let total = 0;
                Object.values(userAssets).forEach(asset => {
                    const price = asset.symbol === 'USDT' ? 1 : (asset.symbol === 'BTC' ? 42000 : (asset.symbol === 'ETH' ? 2200 : 0));
                    total += (asset.total || 0) * price;
                });
                setTotalEstimated(total);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return <div className="assets-loading">Loading assets...</div>;
    }

    return (
        <div className="assets-page">
            <div className="assets-header">
                <button className="back-btn" onClick={() => window.history.back()}>←</button>
                <h1 className="gradient-text">My Assets</h1>
                <div className="header-spacer"></div>
            </div>

            {/* Total Balance Card */}
            <div className="total-assets-card glass-card">
                <div className="card-top">
                    <span className="label">Total Estimated Value</span>
                    <button className="eye-toggle" onClick={() => setBalanceHidden(!balanceHidden)}>
                        {balanceHidden ? '👁️' : '👁️‍🗨️'}
                    </button>
                </div>
                <div className="total-amount">
                    <span className="currency">$</span>
                    <span className="value">
                        {balanceHidden ? '******' : totalEstimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="unit">USD</span>
                </div>
                <div className="pnl-indicator positive">
                    <span className="arrow">▲</span>
                    <span className="percent">+2.45%</span>
                    <span className="time">(24h)</span>
                </div>
            </div>

            {/* Asset List */}
            <div className="asset-list-section">
                <h3 className="section-title">Holdings</h3>
                <div className="asset-grid">
                    {Object.entries(assets).map(([symbol, data]) => (
                        <div key={symbol} className="asset-card glass-card" onClick={() => setSelectedAsset(data)}>
                            <div className="asset-info">
                                <div className={`asset-icon ${symbol.toLowerCase()}`}>
                                    {symbol === 'USDT' ? '₮' : symbol === 'BTC' ? '₿' : symbol === 'ETH' ? 'Ξ' : 'S'}
                                </div>
                                <div className="asset-names">
                                    <span className="name">{data.name}</span>
                                    <span className="symbol">{symbol}</span>
                                </div>
                            </div>
                            <div className="asset-balance">
                                <span className="amount">
                                    {balanceHidden ? '****' : (data.total || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                                </span>
                                <span className="usd-value">
                                    ≈ ${((data.total || 0) * (symbol === 'USDT' ? 1 : symbol === 'BTC' ? 42000 : 2200)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Asset Detail Slider/Modal */}
            {selectedAsset && (
                <div className="asset-modal-overlay" onClick={() => setSelectedAsset(null)}>
                    <div className="asset-modal glass-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle"></div>
                        <div className="modal-header">
                            <h2>{selectedAsset.name} Details</h2>
                            <button className="close-btn" onClick={() => setSelectedAsset(null)}>✕</button>
                        </div>

                        <div className="network-distribution">
                            <span className="dist-label">Network Distribution</span>
                            <div className="network-list">
                                {Object.entries(selectedAsset.networks || {}).map(([network, amount]) => (
                                    <div key={network} className="network-row">
                                        <div className="network-name">
                                            <span className="dot"></span>
                                            {network}
                                        </div>
                                        <div className="network-val">
                                            {amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {selectedAsset.symbol}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="action-btn deposit">Deposit</button>
                            <button className="action-btn withdraw">Withdraw</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

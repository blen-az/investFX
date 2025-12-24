import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getCryptoPrices } from '../services/priceService';
import './Assets.css';

export default function Assets() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeAccount, setActiveAccount] = useState('funding');
    const [balances, setBalances] = useState({
        funding: 0,
        spot: 0,
        futures: 0,
        earn: 0,
        contract: 0,
        fiat: 0,
        commission: 0
    });
    const [assets, setAssets] = useState({});
    const [loading, setLoading] = useState(true);
    const [livePrices, setLivePrices] = useState({});
    const [balanceHidden, setBalanceHidden] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

    const accounts = [
        { id: 'funding', label: 'Funding Account', field: 'mainBalance' },
        { id: 'spot', label: 'Spot Account', field: 'spotBalance' },
        { id: 'contract', label: 'Contract Account', field: 'contractBalance' },
        { id: 'futures', label: 'Futures Account', field: 'tradingBalance' },
        { id: 'fiat', label: 'Fiat Account', field: 'fiatBalance' },
        { id: 'earn', label: 'Earn Account', field: 'earnBalance' },
    ];

    // Fetch live prices
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const prices = await getCryptoPrices();
                setLivePrices(prices);
            } catch (error) {
                console.error("Failed to fetch live prices:", error);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = onSnapshot(doc(db, 'wallets', user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setBalances({
                    funding: data.mainBalance !== undefined ? data.mainBalance : (data.balance || 0),
                    spot: data.spotBalance || 0,
                    futures: data.tradingBalance || 0,
                    earn: data.earnBalance || 0,
                    contract: data.contractBalance || 0,
                    fiat: data.fiatBalance || 0,
                    commission: data.commissionBalance || 0
                });

                const userAssets = data.assets || {
                    USDT: { name: 'Tether', symbol: 'USDT', total: data.mainBalance || data.balance || 0, networks: { "TRC20": data.mainBalance || data.balance || 0 } },
                    BTC: { name: 'Bitcoin', symbol: 'BTC', total: 0, networks: { "Bitcoin": 0 } },
                    ETH: { name: 'Ethereum', symbol: 'ETH', total: 0, networks: { "Ethereum": 0 } },
                };
                setAssets(userAssets);
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
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h1 className="gradient-text">My Assets</h1>
                <div className="header-spacer"></div>
            </div>

            {/* Account Tabs */}
            <div className="account-tabs-container">
                <div className="account-tabs">
                    {accounts.map(acc => (
                        <button
                            key={acc.id}
                            className={`account-tab ${activeAccount === acc.id ? 'active' : ''}`}
                            onClick={() => setActiveAccount(acc.id)}
                        >
                            {acc.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Total Balance Card Redesigned */}
            <div className="account-balance-card glass-card">
                <div className="card-header">
                    <span className="account-type-title">
                        {accounts.find(a => a.id === activeAccount)?.label}
                        <span className="converted-label">Total assets converted (USDT)</span>
                    </span>
                    <button className="eye-toggle" onClick={() => setBalanceHidden(!balanceHidden)}>
                        {balanceHidden ? '👁️' : '👁️‍🗨️'}
                    </button>
                </div>
                <div className="balance-display">
                    <span className="balance-value">
                        {balanceHidden ? '******' : balances[activeAccount].toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 })}
                    </span>
                </div>
            </div>

            {/* Asset List */}
            <div className="asset-list-section">
                <h3 className="section-title">Holdings</h3>
                <div className="asset-grid">
                    {(() => {
                        // Determine which assets to show based on activeAccount
                        let displayAssets = [];

                        if (activeAccount === 'funding') {
                            displayAssets = Object.entries(assets).map(([symbol, data]) => ({ symbol, ...data }));
                        } else {
                            // For other accounts, show the balance as a USDT asset (or similar)
                            const balance = balances[activeAccount] || 0;
                            displayAssets = [{
                                symbol: 'USDT',
                                name: 'Tether',
                                total: balance,
                                networks: { "Internal": balance } // Simplified for non-funding
                            }];
                        }

                        return displayAssets.map((data) => {
                            const symbol = data.symbol;
                            const price = livePrices[symbol] || (symbol === 'USDT' ? 1 : 0);
                            const topNetwork = Object.keys(data.networks || {})[0] || 'Unknown';

                            return (
                                <div key={symbol} className="asset-card glass-card" onClick={() => setSelectedAsset(data)}>
                                    <div className="asset-info">
                                        <div className={`asset-icon ${symbol.toLowerCase()}`}>
                                            {symbol === 'USDT' ? '₮' : symbol === 'BTC' ? '₿' : symbol === 'ETH' ? 'Ξ' : 'S'}
                                        </div>
                                        <div className="asset-names">
                                            <div className="name-row">
                                                <span className="name">{data.name}</span>
                                                <span className="network-badge">{topNetwork}</span>
                                            </div>
                                            <span className="symbol">{symbol}</span>
                                        </div>
                                    </div>
                                    <div className="asset-balance">
                                        <span className="amount">
                                            {balanceHidden ? '****' : (data.total || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                                        </span>
                                        <span className="usd-value">
                                            ≈ ${((data.total || 0) * price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            );
                        });
                    })()}
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
                            <button className="action-btn deposit" onClick={() => navigate('/deposit')}>Deposit</button>
                            <button className="action-btn withdraw" onClick={() => navigate('/withdraw')}>Withdraw</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


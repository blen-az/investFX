// src/pages/Withdraw.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { submitWithdrawal } from "../services/withdrawalService";
import ParticleBackground from "../components/ParticleBackground";
import "./Withdraw.css";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Withdraw() {
    const { user } = useAuth();
    const [selectedCrypto, setSelectedCrypto] = useState(null);
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");
    const [step, setStep] = useState(1); // 1: Select Asset, 2: Enter Details, 3: Success
    const [kycStatus, setKycStatus] = useState("unverified");

    React.useEffect(() => {
        if (!user?.uid) return;
        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                // Priority: New verification object -> Legacy kycStatus field -> Default to unverified
                const status = userData.verification?.status || userData.kycStatus || "unverified";
                setKycStatus(status);
            }
        });
        return () => unsub();
    }, [user]);

    // Mock balances
    const assets = [
        { id: "bitcoin", name: "Bitcoin", symbol: "BTC", icon: "₿", balance: "0.45", color: "#F7931A" },
        { id: "ethereum", name: "Ethereum", symbol: "ETH", icon: "Ξ", balance: "12.5", color: "#627EEA" },
        { id: "tether", name: "Tether", symbol: "USDT", icon: "₮", balance: "5430.00", color: "#26A17B" },
    ];

    const handleNext = async () => {
        if (step === 2) {
            // Validate inputs
            if (!amount || parseFloat(amount) <= 0) {
                alert("Please enter a valid amount");
                return;
            }
            if (!address) {
                alert("Please enter a destination address");
                return;
            }

            try {
                // Submit withdrawal to Firestore
                await submitWithdrawal(
                    user.uid,
                    amount,
                    selectedCrypto.symbol,
                    address
                );
                setStep(3);
            } catch (error) {
                console.error("Error submitting withdrawal:", error);
                alert("Failed to submit withdrawal request. Please try again.");
            }
        } else {
            setStep(step + 1);
        }
    };

    const handleAssetSelect = (asset) => {
        setSelectedCrypto(asset);
        setStep(2);
    };

    return (
        <div className="withdraw-page">
            <ParticleBackground />

            <div className="withdraw-container glass-card">
                <div className="withdraw-header">
                    <button
                        className="back-btn"
                        onClick={() => step > 1 ? setStep(step - 1) : window.history.back()}
                    >
                        ← Back
                    </button>
                    <h1>Withdraw Funds</h1>
                    <div style={{ width: 60 }}></div>
                </div>

                {/* KYC Verification Notice */}
                {kycStatus !== 'verified' && (
                    <div className="kyc-notice-withdraw glass-card" style={{
                        background: kycStatus === 'unverified' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        padding: '20px',
                        marginBottom: '20px',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: kycStatus === 'unverified' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>{kycStatus === 'unverified' ? '🛑' : '⚠️'}</div>
                        <h3 style={{ color: kycStatus === 'unverified' ? '#ef4444' : '#f59e0b', marginTop: 0 }}>
                            {kycStatus === 'unverified' ? 'Verification Required' : 'KYC Under Review'}
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '15px' }}>
                            {kycStatus === 'unverified'
                                ? 'You must verify your identity before withdrawing funds.'
                                : 'Withdrawals will be enabled once your documents are approved.'}
                        </p>
                        {kycStatus === 'unverified' && (
                            <Link to="/profile?tab=kyc" className="verify-now-btn" style={{
                                display: 'inline-block',
                                padding: '10px 20px',
                                background: '#3b82f6',
                                color: 'white',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 700
                            }}>
                                Verify Now
                            </Link>
                        )}
                    </div>
                )}

                {kycStatus === 'verified' && step === 1 && (
                    <div className="asset-selection">
                        <h3>Select Asset to Withdraw</h3>
                        <div className="asset-list">
                            {assets.map((asset) => (
                                <div
                                    key={asset.id}
                                    className="asset-item"
                                    onClick={() => handleAssetSelect(asset)}
                                >
                                    <div className="asset-icon" style={{ color: asset.color }}>{asset.icon}</div>
                                    <div className="asset-info">
                                        <div className="asset-name">{asset.name}</div>
                                        <div className="asset-symbol">{asset.symbol}</div>
                                    </div>
                                    <div className="asset-balance">
                                        <div className="balance-val">{asset.balance}</div>
                                        <div className="balance-label">Available</div>
                                    </div>
                                    <div className="chevron">›</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && selectedCrypto && (
                    <div className="withdraw-form">
                        <div className="selected-asset-summary">
                            <div className="asset-icon" style={{ color: selectedCrypto.color }}>{selectedCrypto.icon}</div>
                            <div>
                                <div className="asset-name">{selectedCrypto.name}</div>
                                <div className="asset-balance">Available: {selectedCrypto.balance} {selectedCrypto.symbol}</div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Withdrawal Address</label>
                            <input
                                type="text"
                                placeholder={`Enter ${selectedCrypto.name} Address`}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="withdraw-input"
                            />
                            <p className="input-hint">Ensure the network matches {selectedCrypto.symbol} (ERC20/TRC20/BTC)</p>
                        </div>

                        <div className="form-group">
                            <label>Amount</label>
                            <div className="amount-input-wrapper">
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="withdraw-input"
                                />
                                <button className="max-btn" onClick={() => setAmount(selectedCrypto.balance)}>MAX</button>
                            </div>
                        </div>

                        <div className="summary-row">
                            <span>Network Fee</span>
                            <span>0.0005 {selectedCrypto.symbol}</span>
                        </div>
                        <div className="summary-row total">
                            <span>Total Receive</span>
                            <span>{amount ? (parseFloat(amount) - 0.0005).toFixed(6) : "0.00"} {selectedCrypto.symbol}</span>
                        </div>

                        <button className="withdraw-submit-btn" onClick={handleNext}>
                            Confirm Withdrawal
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="success-state">
                        <div className="success-icon">✓</div>
                        <h2>Withdrawal Submitted</h2>
                        <p>Your withdrawal request has been received and is being processed.</p>
                        <div className="tx-details">
                            <div className="tx-row">
                                <span>Amount</span>
                                <span>{amount} {selectedCrypto.symbol}</span>
                            </div>
                            <div className="tx-row">
                                <span>Address</span>
                                <span className="address-truncate">{address}</span>
                            </div>
                            <div className="tx-row">
                                <span>Status</span>
                                <span className="status-pending">Pending Review</span>
                            </div>
                        </div>
                        <button className="home-btn" onClick={() => window.location.href = '/home'}>
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

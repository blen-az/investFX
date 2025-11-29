// src/pages/Deposit.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { submitDeposit } from "../services/depositService";
import ParticleBackground from "../components/ParticleBackground";
import "./Deposit.css";

export default function Deposit() {
  const { user } = useAuth();
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [activeTab, setActiveTab] = useState("assets");
  const [searchQuery, setSearchQuery] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [proofFile, setProofFile] = useState(null);

  const handleDepositSubmit = async () => {
    if (!depositAmount || !proofFile) {
      alert("Please enter amount and upload proof of payment.");
      return;
    }

    try {
      await submitDeposit(
        user.uid,
        depositAmount,
        selectedCrypto?.symbol || "BTC",
        proofFile.name
      );

      alert(`Deposit request submitted!\nAmount: ${depositAmount}\nProof: ${proofFile.name}`);
      setDepositAmount("");
      setProofFile(null);
      setSelectedCrypto(null);
    } catch (error) {
      console.error("Error submitting deposit:", error);
      alert("Failed to submit deposit request. Please try again.");
    }
  };

  const cryptocurrencies = [
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      icon: "₿",
      color: "#F7931A",
      balance: "0.00000000",
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      icon: "Ξ",
      color: "#627EEA",
      balance: "0.00000000",
    },
    {
      id: "tether",
      name: "Tether",
      symbol: "USDT",
      icon: "₮",
      color: "#26A17B",
      balance: "0.00000000",
    },
    {
      id: "binance",
      name: "Binance Coin",
      symbol: "BNB",
      icon: "B",
      color: "#F3BA2F",
      balance: "0.00000000",
    },
    {
      id: "cardano",
      name: "Cardano",
      symbol: "ADA",
      icon: "₳",
      color: "#0033AD",
      balance: "0.00000000",
    },
  ];

  const filteredCryptos = cryptocurrencies.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="deposit-page">
      <ParticleBackground />

      <div className="deposit-container">
        {/* Header */}
        <div className="deposit-header">
          <button className="back-btn" onClick={() => window.history.back()}>
            ← Back
          </button>
          <h1 className="deposit-title gradient-text">Load Funds</h1>
          <div className="header-spacer"></div>
        </div>

        {/* Total Balance Card */}
        <div className="balance-card glass-card">
          <div className="balance-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="balance-info">
            <div className="balance-label">TOTAL BALANCE</div>
            <div className="balance-amount gradient-text">$0.00</div>
            <div className="balance-subtitle">Available for trading</div>
          </div>
        </div>

        {/* KYC Verification Notice */}
        <div className="kyc-notice glass-card">
          <div className="kyc-icon">⚠️</div>
          <div className="kyc-content">
            <div className="kyc-title">KYC Verification Required</div>
            <div className="kyc-text">
              Your KYC verification is under review. Please wait for approval before making deposits.
            </div>
          </div>
          <div className="kyc-status">
            <span className="status-badge">Under Review</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search cryptocurrencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="deposit-tabs">
          <button
            className={`tab-btn ${activeTab === "assets" ? "active" : ""}`}
            onClick={() => setActiveTab("assets")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Assets
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8V12L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M3.05 11H5M3.05 13H5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            History
          </button>
        </div>

        {/* Content */}
        {activeTab === "assets" ? (
          <div className="assets-content">
            <div className="section-header">
              <h3 className="section-title">Select Cryptocurrency</h3>
              <p className="section-subtitle">Choose an asset to start depositing</p>
            </div>

            <div className="crypto-list">
              {filteredCryptos.map((crypto) => (
                <div
                  key={crypto.id}
                  className="crypto-item glass-card"
                  onClick={() => setSelectedCrypto(crypto)}
                >
                  <div className="crypto-icon" style={{ color: crypto.color }}>
                    {crypto.icon}
                  </div>
                  <div className="crypto-info">
                    <div className="crypto-name">{crypto.name}</div>
                    <div className="crypto-symbol">{crypto.symbol}</div>
                  </div>
                  <div className="crypto-balance">
                    <div className="balance-value">{crypto.balance}</div>
                    <button className="view-details-btn">
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="history-content">
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No Transaction History</div>
              <div className="empty-text">
                Your deposit history will appear here once you make your first deposit.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Modal (shown when crypto is selected) */}
      {selectedCrypto && (
        <div className="modal-overlay" onClick={() => setSelectedCrypto(null)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCrypto(null)}>
              ✕
            </button>

            <div className="modal-header">
              <div className="modal-icon" style={{ color: selectedCrypto.color }}>
                {selectedCrypto.icon}
              </div>
              <h2 className="modal-title">Deposit {selectedCrypto.name}</h2>
              <p className="modal-subtitle">{selectedCrypto.symbol}</p>
            </div>

            <div className="deposit-info">
              <div className="info-item">
                <div className="info-label">Network</div>
                <div className="info-value">
                  {selectedCrypto.symbol === "USDT" ? "TRC20" : selectedCrypto.symbol}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Minimum Deposit</div>
                <div className="info-value">
                  {selectedCrypto.symbol === "BTC" ? "0.0001" : selectedCrypto.symbol === "ETH" ? "0.001" : "10"} {selectedCrypto.symbol}
                </div>
              </div>
            </div>

            <div className="wallet-address">
              <div className="address-label">Deposit Address</div>
              <div className="address-box">
                <code className="address-code">
                  {selectedCrypto.symbol === "BTC"
                    ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                    : selectedCrypto.symbol === "ETH"
                      ? "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                      : "TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS"}
                </code>
                <button className="copy-btn" onClick={() => {
                  navigator.clipboard.writeText(
                    selectedCrypto.symbol === "BTC"
                      ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                      : selectedCrypto.symbol === "ETH"
                        ? "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                        : "TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS"
                  );
                  alert("Address copied!");
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.6018 3.08839C16.2171 2.71211 15.7016 2.5 15.1634 2.5H10C8.89543 2.5 8 3.39543 8 4.5V4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  Copy
                </button>
              </div>
            </div>

            <div className="deposit-form">
              <div className="form-group">
                <label className="form-label">Amount Deposited ({selectedCrypto.symbol})</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Proof of Payment (Screenshot)</label>
                <div className="file-upload-box">
                  <input
                    type="file"
                    id="proof-upload"
                    className="file-input"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files[0])}
                  />
                  <label htmlFor="proof-upload" className="file-label">
                    {proofFile ? (
                      <span className="file-name">{proofFile.name}</span>
                    ) : (
                      <>
                        <span className="upload-icon">📁</span>
                        <span>Click to upload screenshot</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <button className="submit-deposit-btn" onClick={handleDepositSubmit}>
                Submit Deposit Request
              </button>
            </div>

            <div className="deposit-warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>
                Send only {selectedCrypto.symbol} to this address. Sending other assets may result in permanent loss.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import StatsCard from "../components/StatsCard";
import DataTable from "../components/DataTable";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { getUserTransactions } from "../services/transactionService";
import "./Profile.css";

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("transactions");
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [balance, setBalance] = useState(0);

  // KYC State
  const [kycStatus, setKycStatus] = useState("unverified");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Listen to wallet balance
    const unsubWallet = onSnapshot(doc(db, "wallets", user.uid), (doc) => {
      if (doc.exists()) {
        setBalance(doc.data().balance || 0);
      }
    });

    // Listen to user profile for KYC status
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        setKycStatus(doc.data().kycStatus || "unverified");
      }
    });

    // Load transactions
    loadTransactions();

    return () => {
      unsubWallet();
      unsubUser();
    };
  }, [user]);

  const loadTransactions = async () => {
    if (!user?.uid) return;
    try {
      setLoadingTransactions(true);
      const data = await getUserTransactions(user.uid);
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Handle ID Upload
  const handleUploadID = async () => {
    if (!idFile) return;

    // Validate file
    if (idFile.size > 10 * 1024 * 1024) { // 10MB limit
      alert("File is too large. Please upload an image smaller than 10MB.");
      return;
    }

    try {
      setUploading(true);
      console.log("Starting ID upload...");

      // Upload to Firebase Storage
      const fileRef = ref(storage, `kyc/${user.uid}/${idFile.name}`);
      console.log("Uploading to:", `kyc/${user.uid}/${idFile.name}`);
      await uploadBytes(fileRef, idFile);
      console.log("Upload complete, getting URL...");

      const url = await getDownloadURL(fileRef);
      console.log("URL obtained:", url);

      // Update Firestore
      console.log("Updating Firestore...");
      await updateDoc(doc(db, "users", user.uid), {
        kycStatus: "pending",
        idUrl: url,
        kycSubmittedAt: new Date().toISOString()
      });

      setShowUploadModal(false);
      setIdFile(null);
      alert("ID submitted for review! Verification takes 24-48h.");
    } catch (error) {
      console.error("Upload failed:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      // Show specific error
      let errorMsg = "Failed to upload ID. ";
      if (error.code === 'storage/unauthorized') {
        errorMsg += "Permission denied. Please contact support.";
      } else if (error.code === 'storage/canceled') {
        errorMsg += "Upload was cancelled.";
      } else if (error.code === 'storage/unknown') {
        errorMsg += "Network error. Please check your connection.";
      } else {
        errorMsg += error.message || "Please try again.";
      }

      alert(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  // Mock Data
  const portfolioValue = balance;
  const todayPL = 450.25;
  const totalTrades = 128;
  const winRate = 68;
  const referralCode = "TRADER2025";

  // Dynamic Badge Logic
  const getBadge = () => {
    if (kycStatus === "verified") return <span className="profile-badge status-verified">Verified</span>;
    if (kycStatus === "pending") return <span className="profile-badge status-pending">Under Review</span>;
    return <span className="profile-badge status-unverified">Unverified</span>;
  };

  // Transactions are now fetched from Firestore via loadTransactions()

  const columns = [
    {
      header: "Type",
      key: "type",
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: value.includes('Deposit') || value.includes('Profit') ? '#10b981' :
              value.includes('Withdrawal') || value.includes('Loss') ? '#ef4444' : '#3b82f6'
          }} />
          {value}
        </div>
      )
    },
    {
      header: "Amount",
      key: "amount",
      render: (value) => (
        <span style={{
          color: value > 0 ? '#10b981' : value < 0 ? '#ef4444' : '#f8fafc',
          fontWeight: 600
        }}>
          {value > 0 ? '+' : ''}{value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </span>
      )
    },
    {
      header: "Status",
      key: "status",
      render: (value) => (
        <span className={`badge ${value === 'completed' ? 'badge-success' : 'badge-warning'}`}>
          {value}
        </span>
      )
    },
    {
      header: "Date",
      key: "date",
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  return (
    <div className="profile-page">
      {/* Header Section */}
      <div className="profile-header-section">
        <div className="profile-card">
          <div className="profile-info">
            <div className="profile-avatar">
              {(user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="profile-details">
              <h1>
                {user?.email ? user.email.split("@")[0] : "Trader"}
                {getBadge()}
              </h1>
              <div className="profile-email">{user?.email}</div>
            </div>
          </div>

          <div className="profile-stats-row">
            <div className="profile-stat">
              <div className="stat-label">Total Balance</div>
              <div className="stat-value highlight">
                {balanceHidden ? "••••••" : `$${portfolioValue.toLocaleString()}`}
                <button
                  onClick={() => setBalanceHidden(!balanceHidden)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', marginLeft: '8px', cursor: 'pointer' }}
                >
                  {balanceHidden ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            <div className="profile-stat">
              <div className="stat-label">Today's P&L</div>
              <div className="stat-value" style={{ color: '#10b981' }}>+${todayPL}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-grid">
          <Link to="/deposit" className="action-card">
            <div className="action-icon">💰</div>
            <div className="action-info">
              <h3>Deposit</h3>
              <p>Add funds instantly</p>
            </div>
          </Link>
          <Link to="/trade" className="action-card">
            <div className="action-icon">📈</div>
            <div className="action-info">
              <h3>Trade</h3>
              <p>Start trading now</p>
            </div>
          </Link>
          <Link to="/withdraw" className="action-card">
            <div className="action-icon">🏦</div>
            <div className="action-info">
              <h3>Withdraw</h3>
              <p>Cash out earnings</p>
            </div>
          </Link>
          <button onClick={() => { }} className="action-card" style={{ cursor: 'not-allowed', opacity: 0.7 }}>
            <div className="action-icon">⚙️</div>
            <div className="action-info">
              <h3>Settings</h3>
              <p>Account preferences</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="profile-content-grid">
        {/* Left Column - Transactions & History */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title">Activity History</div>
            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                Transactions
              </button>
              <button
                className={`tab-btn ${activeTab === 'trades' ? 'active' : ''}`}
                onClick={() => setActiveTab('trades')}
              >
                Trade History
              </button>
            </div>
          </div>

          {activeTab === 'transactions' ? (
            <DataTable columns={columns} data={transactions} />
          ) : (
            <div className="empty-state">
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                No trade history available yet.
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stats & Trust */}
        <div className="sidebar-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="content-card">
            <div className="card-title" style={{ marginBottom: '20px' }}>Trust Score</div>
            <div className="trust-score-container">
              <div className="trust-circle" style={{
                borderColor: kycStatus === 'verified' ? '#10b981' : kycStatus === 'pending' ? '#f59e0b' : '#ef4444',
                borderTopColor: kycStatus === 'verified' ? '#10b981' : kycStatus === 'pending' ? '#f59e0b' : '#ef4444'
              }}>
                <div className="trust-value" style={{
                  color: kycStatus === 'verified' ? '#10b981' : kycStatus === 'pending' ? '#f59e0b' : '#ef4444'
                }}>
                  {kycStatus === 'verified' ? '100' : kycStatus === 'pending' ? '50' : '20'}
                </div>
                <div className="trust-label">Score</div>
              </div>

              {/* Verification Call to Action */}
              <div className="verification-status" style={{ flexDirection: 'column', gap: 12 }}>
                {kycStatus === 'verified' ? (
                  <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ✓ Fully Verified
                  </div>
                ) : kycStatus === 'pending' ? (
                  <div style={{ color: '#f59e0b' }}>⧗ In Review</div>
                ) : (
                  <button
                    className="btn-verify"
                    onClick={() => setShowUploadModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Upload ID to Verify
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="content-card">
            <div className="card-title">Trading Stats</div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Total Trades</span>
                <span style={{ fontWeight: '600' }}>{totalTrades}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Win Rate</span>
                <span style={{ fontWeight: '600', color: '#10b981' }}>{winRate}%</span>
              </div>
            </div>

            <div className="referral-box">
              <div className="referral-label">Your Referral Code</div>
              <div className="referral-code-display">
                <span className="code">{referralCode}</span>
                <span className="copy-icon" title="Copy Code">📋</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload ID Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowUploadModal(false)}>✕</button>
            <h2 style={{ marginTop: 0, color: 'white' }}>Verify Identity</h2>
            <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Please upload a clear photo of your ID (Passport, Driver's License) to unlock full features.</p>

            <div className="file-upload-box" style={{ marginBottom: '20px' }}>
              <input
                type="file"
                id="id-proof-upload"
                className="file-input"
                accept="image/*"
                onChange={(e) => setIdFile(e.target.files[0])}
              />
              <label htmlFor="id-proof-upload" className="file-label">
                {idFile ? <span style={{ color: '#10b981' }}>{idFile.name}</span> : <span>📁 Click to Select Image</span>}
              </label>
            </div>

            <button
              className="submit-deposit-btn"
              onClick={handleUploadID}
              disabled={uploading}
              style={{ opacity: uploading ? 0.7 : 1 }}
            >
              {uploading ? "Uploading..." : "Submit for Verification"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

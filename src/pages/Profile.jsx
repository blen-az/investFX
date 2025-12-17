// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import StatsCard from "../components/StatsCard";
import DataTable from "../components/DataTable";
import Toast from "../components/Toast";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getUserTransactions } from "../services/transactionService";
import "./Profile.css";


export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("transactions");
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [balance, setBalance] = useState(0);

  // KYC State
  const [kycStatus, setKycStatus] = useState("unverified");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

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
    if (!idFile) {
      setToast({ message: "Please select a file first.", type: "warning" });
      return;
    }

    // Validate file type
    if (!idFile.type.startsWith('image/')) {
      setToast({ message: "Please upload an image file (JPG, PNG, etc.)", type: "warning" });
      return;
    }

    // Validate file size
    if (idFile.size > 10 * 1024 * 1024) { // 10MB limit
      setToast({ message: "File is too large. Please upload an image smaller than 10MB.", type: "warning" });
      return;
    }

    try {
      setUploading(true);
      console.log("Starting ID upload to Cloudinary...");
      console.log("File details:", { name: idFile.name, size: idFile.size, type: idFile.type });

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", idFile);
      formData.append("upload_preset", "invest"); // Your Unsigned Upload Preset
      formData.append("cloud_name", "dlzvewiff"); // Your Cloud Name
      formData.append("folder", "kyc"); // Organize uploads in a folder

      console.log("Uploading to Cloudinary...");
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dlzvewiff/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloudinary error response:", errorData);
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || "Unknown error"}`);
      }

      const data = await response.json();
      const uploadedUrl = data.secure_url;
      console.log("Upload complete! URL:", uploadedUrl);

      // Update Firestore with Cloudinary URL
      console.log("Updating user document in Firestore...");
      await updateDoc(doc(db, "users", user.uid), {
        kycStatus: "pending",
        idUrl: uploadedUrl,
        kycSubmittedAt: new Date().toISOString()
      });

      setShowUploadModal(false);
      setIdFile(null);
      setUploading(false);
      setToast({
        message: "ID submitted successfully! Your documents will be reviewed within 24-48 hours.",
        type: "success"
      });
    } catch (error) {
      console.error("=== UPLOAD ERROR ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);

      // Show specific error with actionable guidance
      let errorMsg = "❌ Upload Failed\n\n";

      if (error.message.includes("Cloudinary")) {
        errorMsg += error.message + "\n\n";
        errorMsg += "This usually means:\n";
        errorMsg += "• Check your internet connection\n";
        errorMsg += "• File format may not be supported\n";
        errorMsg += "• Upload preset might be misconfigured\n\n";
        errorMsg += "Please try again or contact support.";
      } else if (error.message.includes("Network")) {
        errorMsg += "Network error occurred.\n";
        errorMsg += "Please check your internet connection and try again.";
      } else if (error.message.includes("timeout")) {
        errorMsg += "Upload timed out.\n";
        errorMsg += "Please check your connection and try a smaller file.";
      } else {
        errorMsg += `Error: ${error.message || "Unknown error"}\n\n`;
        errorMsg += "Please try again or contact support if the issue persists.";
      }

      setToast({
        message: errorMsg,
        type: "error"
      });
      setUploading(false);
    }
  };

  // Mock Data
  const portfolioValue = balance;
  const todayPL = 450.25;
  const totalTrades = 128;
  const winRate = 68;

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

          {/* Settings Card */}
          <Link to="/settings" className="action-card">
            <div className="action-icon">⚙️</div>
            <div className="action-info">
              <h3>Settings</h3>
              <p>Manage your account</p>
            </div>
          </Link>
        </div>

        {/* Logout Button - Prominent on Mobile */}
        <button
          onClick={async () => {
            try {
              await logout();
              navigate('/');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }}
          className="profile-logout-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" />
            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" />
          </svg>
          Logout
        </button>
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

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import StatsCard from "../components/StatsCard";
import DataTable from "../components/DataTable";
import Toast from "../components/Toast";
import FileUpload from "../components/FileUpload";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getUserTransactions } from "../services/transactionService";
import {
  uploadVerificationDocuments,
  submitVerification
} from "../services/verificationService";
import "./Profile.css";


export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("transactions");
  const [balance, setBalance] = useState(0);

  // KYC State
  const [kycStatus, setKycStatus] = useState("unverified");
  const [rejectionReason, setRejectionReason] = useState(null);
  const [idFrontFile, setIdFrontFile] = useState(null);
  const [idBackFile, setIdBackFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Handle Tab Deep-linking
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'kyc') {
      setActiveTab('kyc');
    }
  }, [location]);

  useEffect(() => {
    if (!user?.uid) return;

    // Listen to wallet balance
    const unsubWallet = onSnapshot(doc(db, "wallets", user.uid), (doc) => {
      if (doc.exists()) {
        setBalance(doc.data().balance || 0);
      }
    });

    // Listen to user profile for KYC status (Nested verification object)
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        // Priority: New verification object -> Legacy kycStatus field -> Default to unverified
        const status = userData.verification?.status || userData.kycStatus || "unverified";
        setKycStatus(status);
        setRejectionReason(userData.verification?.rejectionReason || null);
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
    if (!idFrontFile || !idBackFile) {
      setToast({ message: "Please select both Front and Back ID files.", type: "warning" });
      return;
    }

    try {
      setUploading(true);
      console.log("Starting ID upload to Cloudinary...");

      // 1. Upload both images via service
      const { frontUrl, backUrl } = await uploadVerificationDocuments(idFrontFile, idBackFile);
      console.log("Upload complete! URLs:", { frontUrl, backUrl });

      // 2. Submit verification via service
      await submitVerification(user.uid, frontUrl, backUrl);

      setIdFrontFile(null);
      setIdBackFile(null);
      setUploading(false);
      setToast({
        message: "ID submitted successfully! Your documents will be reviewed within 24-48 hours.",
        type: "success"
      });
    } catch (error) {
      console.error("=== UPLOAD ERROR ===", error);
      setToast({
        message: "❌ Upload Failed. Please check your connection and try again.",
        type: "error"
      });
      setUploading(false);
    }
  };

  // Dynamic Badge Logic
  const getBadge = () => {
    if (kycStatus === "verified") return <span className="profile-badge status-verified">Verified</span>;
    if (kycStatus === "pending") return <span className="profile-badge status-pending">In Review</span>;
    if (kycStatus === "rejected") return <span className="profile-badge status-rejected" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Rejected</span>;
    return <span className="profile-badge status-unverified">Unverified</span>;
  };

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
            background: value?.includes('Deposit') || value?.includes('Profit') ? '#10b981' :
              value?.includes('Withdrawal') || value?.includes('Loss') ? '#ef4444' : '#3b82f6'
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
          {value > 0 ? '+' : ''}{value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </span>
      )
    },
    {
      header: "Status",
      key: "status",
      render: (value) => (
        <span className={`badge ${value === 'completed' || value === 'done' ? 'badge-success' : 'badge-warning'}`}>
          {value}
        </span>
      )
    },
    {
      header: "Date",
      key: "date",
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  return (
    <div className="profile-page settings-view">
      {/* Header */}
      <div className="settings-header">
        <Link to="/wallet" className="back-link">← Back</Link>
        <h1>Settings & Profile</h1>
      </div>

      {/* Profile Overview (Simplified) */}
      <div className="settings-user-box">
        <div className="settings-avatar">
          {(user?.displayName || user?.email || "U")[0].toUpperCase()}
        </div>
        <div className="settings-details">
          <h2>{user?.displayName || "Trader"}</h2>
          <div className="settings-id">ID: {user?.uid}</div>
          <p className="settings-email-sub">{user?.email}</p>
          {getBadge()}
        </div>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`settings-tab ${activeTab === 'kyc' ? 'active' : ''}`}
          onClick={() => setActiveTab('kyc')}
        >
          ID Upload
        </button>
      </div>

      {/* Content */}
      <div className="settings-content">
        {activeTab === 'transactions' ? (
          <div className="transactions-view">
            <DataTable columns={columns} data={transactions} />
            {transactions.length === 0 && !loadingTransactions && (
              <div className="empty-history">No transaction history found.</div>
            )}
            {loadingTransactions && <div className="loading-history">Loading history...</div>}
          </div>
        ) : (
          <div className="verification-view">
            <div className="verification-card glass-panel">
              <div className="verification-header">
                <span className="verify-icon">🛡️</span>
                <h3>Identify Verification</h3>
              </div>
              <p>To comply with financial regulations and protect your account, please upload clear photos of your Government ID (Passport, Driver's License, or National ID).</p>

              <div className="verification-status-bar">
                Status: <span className={`status-val ${kycStatus}`}>{kycStatus.toUpperCase()}</span>
              </div>

              {kycStatus === 'rejected' && (
                <div className="status-message rejected-box" style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '20px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>❌</span>
                  <h4 style={{ color: '#ef4444', margin: '0 0 8px 0' }}>Verification Rejected</h4>
                  <p style={{ color: '#f8fafc', margin: 0 }}>
                    Reason: {rejectionReason || "Documents did not meet requirements."}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
                    Please upload new, clear documents below.
                  </p>
                </div>
              )}

              {(kycStatus === 'unverified' || kycStatus === 'rejected') && (
                <div className="upload-ui">
                  <div className="dual-upload">
                    <FileUpload
                      id="front"
                      label="Front of ID"
                      onFileSelect={(file) => setIdFrontFile(file)}
                    />
                    <FileUpload
                      id="back"
                      label="Back of ID"
                      onFileSelect={(file) => setIdBackFile(file)}
                    />
                  </div>

                  {(idFrontFile || idBackFile) && (
                    <div className="file-ready-msg">
                      {idFrontFile && <div>✓ Front: {idFrontFile.name}</div>}
                      {idBackFile && <div>✓ Back: {idBackFile.name}</div>}
                    </div>
                  )}

                  <button
                    className="verify-submit-huge"
                    onClick={handleUploadID}
                    disabled={uploading || !idFrontFile || !idBackFile}
                  >
                    {uploading ? "Applying..." : "Submit for Verification"}
                  </button>
                </div>
              )}

              {kycStatus === 'pending' && (
                <div className="status-message pending-box">
                  <div className="spinner-small"></div>
                  <h4>Review in Progress</h4>
                  <p>Our team is verifying your documents. This typically takes 24 hours.</p>
                </div>
              )}

              {kycStatus === 'verified' && (
                <div className="status-message verified-box">
                  <span className="huge-check">✅</span>
                  <h4>Identity Verified</h4>
                  <p>You have full access to all withdrawal and trading features.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={async () => {
          try {
            await logout();
            navigate('/');
          } catch (error) {
            console.error('Logout error:', error);
          }
        }}
        className="settings-logout-btn"
      >
        Logout
      </button>

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

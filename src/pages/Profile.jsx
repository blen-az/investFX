// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import StatsCard from "../components/StatsCard";
import DataTable from "../components/DataTable";
import Toast from "../components/Toast";
import FileUpload from "../components/FileUpload";
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
    <div className="profile-page settings-view">
      {/* Header */}
      <div className="settings-header">
        <Link to="/wallet" className="back-link">← Back</Link>
        <h1>Settings & Profile</h1>
      </div>

      {/* Profile Overview (Simplified) */}
      <div className="settings-user-box">
        <div className="settings-avatar">
          {(user?.email || "U")[0].toUpperCase()}
        </div>
        <div className="settings-details">
          <h2>{user?.email}</h2>
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
            <div className="verification-card">
              <h3>Verification Status</h3>
              <p>Please upload a clear photo of your ID (Passport or Driver's License) to verify your identity.</p>

              <div className="verification-current">
                Status: {kycStatus.toUpperCase()}
              </div>

              {kycStatus === 'unverified' && (
                <div className="upload-section">
                  <FileUpload
                    label="Choose ID Document"
                    onFileSelect={(file) => setIdFile(file)}
                  />
                  <button
                    className="verify-submit-btn"
                    onClick={handleUploadID}
                    disabled={uploading || !idFile}
                  >
                    {uploading ? "Uploading..." : "Submit for Verification"}
                  </button>
                </div>
              )}
              {kycStatus === 'pending' && <p className="review-txt">Your ID is currently under review. This usually takes 24-48 hours.</p>}
              {kycStatus === 'verified' && <p className="success-txt">✓ Your account is fully verified.</p>}
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


      {/* Upload ID Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '500px',
            width: '90%'
          }}>
            <button className="modal-close" onClick={() => setShowUploadModal(false)}>✕</button>
            <h2 style={{ marginTop: 0, color: 'white', marginBottom: '12px' }}>Verify Identity</h2>
            <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
              Please upload a clear photo of your ID (Passport, Driver's License) to unlock full features.
            </p>

            <FileUpload
              label="ID Document"
              onFileSelect={(file) => setIdFile(file)}
            />

            <button
              className="submit-deposit-btn"
              onClick={handleUploadID}
              disabled={uploading || !idFile}
              style={{
                opacity: (uploading || !idFile) ? 0.7 : 1,
                marginTop: '16px',
                width: '100%'
              }}
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

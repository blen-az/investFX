// src/pages/Profile.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import StatsCard from "../components/StatsCard";
import DataTable from "../components/DataTable";
import "./Profile.css";

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("transactions");
  const [balanceHidden, setBalanceHidden] = useState(false);

  // Mock Data
  const portfolioValue = 150000;
  const todayPL = 450.25;
  const totalTrades = 128;
  const winRate = 68;
  const referralCode = "TRADER2025";

  const transactions = [
    { id: 1, type: "Deposit", amount: 5000, status: "completed", date: "2025-11-26" },
    { id: 2, type: "Trade Profit", amount: 450.25, status: "completed", date: "2025-11-26" },
    { id: 3, type: "Withdrawal", amount: -1000, status: "pending", date: "2025-11-25" },
    { id: 4, type: "Trade Loss", amount: -120.50, status: "completed", date: "2025-11-24" },
    { id: 5, type: "Deposit", amount: 10000, status: "completed", date: "2025-11-20" },
  ];

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
                <span className="profile-badge">Verified Trader</span>
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
          <Link to="/settings" className="action-card">
            <div className="action-icon">⚙️</div>
            <div className="action-info">
              <h3>Settings</h3>
              <p>Account preferences</p>
            </div>
          </Link>
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
              <div className="trust-circle">
                <div className="trust-value">100</div>
                <div className="trust-label">Score</div>
              </div>
              <div className="verification-status">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Fully Verified
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
    </div>
  );
}

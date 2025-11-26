// src/pages/Profile.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const { user } = useAuth();
  const [balanceHidden, setBalanceHidden] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions"); // transactions | trading | achievements

  // placeholder data (replace with real data later)
  const referral = "1L1XHP4Q";
  const totalPortfolio = 150000;
  const todayPL = 0;
  const totalTrades = 0;
  const trustScore = 100;
  const memberSince = "Nov 2025";

  const transactions = [
    {
      id: 1,
      type: "Deposit",
      desc: "Deposit transaction",
      date: "Nov 6, 2025",
      amount: "+$150,000.00",
      status: "approved",
    },
    // add more placeholder items if desired
  ];

  return (
    <div className="fx-profile container">
      {/* top header */}
      <div className="profile-header card-gradient">
        <div className="profile-top">
          <div className="avatar">
            <div className="avatar-inner">{(user?.email || "U")[0].toUpperCase()}</div>
          </div>

          <div className="profile-meta">
            <div className="profile-name">
              {user?.email ? user.email.split("@")[0] : "trader10602"}
              <span className="badge-real">REAL</span>
            </div>
            <div className="profile-sub">Unknown</div>
          </div>

          <div className="profile-actions">
            <button className="dots">⋮</button>
          </div>
        </div>

        {/* portfolio card */}
        <div className="portfolio-card">
          <div className="portfolio-left">
            <div className="portfolio-title">Total Portfolio Value</div>

            <div className="portfolio-value-row">
              <div className="portfolio-value">
                {balanceHidden ? "•••••••" : `$${Number(totalPortfolio).toLocaleString()}`}
              </div>

              <button
                className="eye-toggle"
                onClick={() => setBalanceHidden((s) => !s)}
                aria-label={balanceHidden ? "Show balance" : "Hide balance"}
                title={balanceHidden ? "Show balance" : "Hide balance"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </button>
            </div>

            <div className="portfolio-change">↑ <span className="positive">+$0.00 today</span></div>
          </div>

          <div className="portfolio-right">
            <div className="ref-wrap">
              <div className="ref-title">Referral Code</div>
              <div className="ref-code">{referral}</div>
            </div>

            <Link to="/assets" className="btn small ghost">Assets</Link>
          </div>
        </div>

        {/* quick actions row inside header */}
        <div className="profile-quick">
          <Link to="/assets" className="quick-card">Assets</Link>
          <Link to="/swap" className="quick-card">Swap</Link>
          <Link to="/history" className="quick-card">History</Link>
        </div>

        <div className="member-since">Member since {memberSince}</div>
      </div>

      {/* main content grid */}
      <div className="profile-grid">
        {/* left column */}
        <div className="profile-left">
          {/* tabs */}
          <div className="tabs card">
            <button
              className={activeTab === "transactions" ? "tab active" : "tab"}
              onClick={() => setActiveTab("transactions")}
            >
              Transactions
            </button>
            <button
              className={activeTab === "trading" ? "tab active" : "tab"}
              onClick={() => setActiveTab("trading")}
            >
              Trading
            </button>
            <button
              className={activeTab === "achievements" ? "tab active" : "tab"}
              onClick={() => setActiveTab("achievements")}
            >
              Achievements
            </button>
          </div>

          {/* tab content */}
          <div className="tab-content card">
            {activeTab === "transactions" && (
              <>
                <h3>Recent Transactions</h3>
                <div className="tx-list">
                  {transactions.map((t) => (
                    <div key={t.id} className="tx-row">
                      <div className="tx-left">
                        <div className="tx-icon">⬇️</div>
                        <div>
                          <div className="tx-title">{t.type}</div>
                          <div className="tx-desc">{t.desc}</div>
                          <div className="tx-date">{t.date}</div>
                        </div>
                      </div>

                      <div className="tx-right">
                        <div className="tx-amount positive">{t.amount}</div>
                        <div className={`tx-status ${t.status}`}>{t.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "trading" && (
              <div className="placeholder-block">
                <p>No trading history yet — start trading to see history here.</p>
              </div>
            )}

            {activeTab === "achievements" && (
              <div className="placeholder-block">
                <p>No achievements yet — complete actions to unlock badges.</p>
              </div>
            )}
          </div>
        </div>

        {/* right column */}
        <aside className="profile-right">
          <div className="stat-card card">
            <div className="stat-title">Today's P&amp;L</div>
            <div className="stat-value positive">+${todayPL.toFixed(2)}</div>
          </div>

          <div className="stat-card card">
            <div className="stat-title">Total Trades</div>
            <div className="stat-value">{totalTrades}</div>
          </div>

          <div className="trust-card card">
            <div className="trust-title">Trust Score</div>
            <div className="trust-bar">
              <div className="fill" style={{ width: `${trustScore}%` }} />
            </div>
            <div className="trust-percent">{trustScore}%</div>
            <div className="verified">
              <span className="verified-badge">✔</span> Verified
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

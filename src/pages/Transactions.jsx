// src/pages/Transactions.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserTransactions } from "../services/transactionService";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft, ArrowUpRight, RefreshCw,
  Activity, RotateCcw
} from "lucide-react";
import "./Transactions.css";

function groupByDate(txs) {
  const groups = {};
  txs.forEach((tx) => {
    const d = tx.date ? new Date(tx.date) : null;
    const label = d
      ? isToday(d) ? "Today"
        : isYesterday(d) ? "Yesterday"
          : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "Unknown";
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  });
  return groups;
}

function isToday(d) {
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}
function isYesterday(d) {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return d.getDate() === y.getDate() && d.getMonth() === y.getMonth() && d.getFullYear() === y.getFullYear();
}

function formatTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function TxRow({ tx }) {
  const isDeposit = tx.type === "Deposit";
  const isWithdraw = tx.type === "Withdrawal";
  const isWin = tx.status === "Win";
  const isLoss = tx.status === "Loss";

  const icon = isDeposit
    ? <ArrowDownLeft size={16} />
    : isWithdraw
      ? <ArrowUpRight size={16} />
      : <RefreshCw size={15} />;

  const iconBg = isDeposit ? "var(--wm-positive-s)"
    : isWithdraw ? "var(--wm-negative-s)"
      : "var(--wm-accent-s)";

  const iconColor = isDeposit ? "var(--wm-positive)"
    : isWithdraw ? "var(--wm-negative)"
      : "var(--wm-accent)";

  const amt = typeof tx.amount === "number" ? tx.amount : parseFloat(tx.amount) || 0;
  const prefix = isDeposit || isWin ? "+" : "-";
  const amtColor = isDeposit || isWin ? "var(--wm-positive)" : "var(--wm-negative)";

  const statusColor = {
    approved: "var(--wm-positive)", completed: "var(--wm-positive)",
    pending: "var(--wm-warning)", processing: "var(--wm-warning)",
    Win: "var(--wm-positive)", Loss: "var(--wm-negative)",
    rejected: "var(--wm-negative)"
  }[tx.status] || "var(--wm-text-3)";

  return (
    <div className="tx-row">
      <div className="tx-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div className="tx-info">
        <span className="tx-type">{tx.type}</span>
        <div className="tx-meta-row">
          {tx.asset && <span className="tx-asset">{tx.asset}</span>}
          {tx.details && <span className="tx-details">{tx.details}</span>}
        </div>
      </div>
      <div className="tx-right">
        <span className="tx-amount" style={{ color: amtColor }}>
          {prefix}${Math.abs(amt).toFixed(2)}
        </span>
        <div className="tx-status-row">
          <span className="tx-status" style={{ color: statusColor }}>{tx.status}</span>
          <span className="tx-time">{formatTime(tx.date)}</span>
        </div>
      </div>
    </div>
  );
}

const FILTERS = ["All", "Deposit", "Withdrawal", "Trade"];

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getUserTransactions(user.uid);
      setTransactions(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "All"
    ? transactions
    : transactions.filter(t => t.type === filter);

  const groups = groupByDate(filtered);

  return (
    <div className="tx-page">

      {/* Header */}
      <div className="tx-page-header anim-fade-up">
        <div>
          <h1 className="tx-page-title">Activity</h1>
          <p className="tx-page-sub">Track all account activity</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="wm-filter-tabs anim-fade-up delay-1">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`wm-filter-tab${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="tx-list-card anim-fade-up delay-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="tx-row">
              <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton skeleton-text" style={{ width: 100 }} />
                <div className="skeleton skeleton-text" style={{ width: 70 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <div className="skeleton skeleton-text" style={{ width: 80 }} />
                <div className="skeleton skeleton-text" style={{ width: 60 }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="wm-empty anim-fade-up delay-2">
          <div className="wm-empty-icon"><Activity size={24} /></div>
          <p className="wm-empty-title">Something went wrong</p>
          <p className="wm-empty-desc">{error}</p>
          <button className="btn-primary" onClick={load} style={{ marginTop: 8 }}>
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="wm-empty anim-fade-up delay-2">
          <div className="wm-empty-icon"><Activity size={24} /></div>
          <p className="wm-empty-title">No transactions yet</p>
          <p className="wm-empty-desc">Deposits, withdrawals and trades will appear here.</p>
          <Link to="/deposit" className="btn-primary" style={{ marginTop: 8 }}>
            Make a Deposit
          </Link>
        </div>
      ) : (
        <div className="tx-groups anim-fade-up delay-2">
          {Object.entries(groups).map(([label, txs]) => (
            <div key={label} className="tx-group">
              <div className="tx-group-label">{label}</div>
              <div className="tx-list-card">
                {txs.map((tx, i) => <TxRow key={i} tx={tx} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

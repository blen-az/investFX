import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserTransactions } from "../services/transactionService";
import ParticleBackground from "../components/ParticleBackground";
import DataTable from "../components/DataTable";
import "./Transactions.css";

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const loadTransactions = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserTransactions(user.uid);
      setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadTransactions();
    }
  }, [user, loadTransactions]);

  const filteredData = filter === "All"
    ? transactions
    : transactions.filter(t => t.type === filter);

  const columns = [
    {
      header: "Type",
      key: "type",
      render: (value) => (
        <span className={`badge ${value === 'Deposit' ? 'badge-success' :
          value === 'Withdrawal' ? 'badge-danger' :
            'badge-warning'
          }`}>
          {value}
        </span>
      )
    },
    {
      header: "Asset",
      key: "asset",
      render: (value) => <span className="font-mono text-gray-300">{value}</span>
    },
    {
      header: "Amount",
      key: "amount",
      render: (value, row) => {
        const isPositive = value > 0;

        return (
          <span style={{
            color: isPositive ? '#10b981' : '#ef4444',
            fontWeight: 600
          }}>
            {isPositive ? '+' : ''}${Math.abs(value).toFixed(2)}
          </span>
        );
      }
    },
    {
      header: "Status",
      key: "status",
      render: (value) => (
        <span style={{
          textTransform: 'capitalize',
          color: value === 'approved' || value === 'Win' ? '#10b981' :
            value === 'rejected' || value === 'Loss' ? '#ef4444' : '#f59e0b'
        }}>
          {value}
        </span>
      )
    },
    {
      header: "Details",
      key: "details",
      render: (value) => <span className="text-xs text-gray-400">{value}</span>
    },
    {
      header: "Date",
      key: "date",
      render: (value) => value ? new Date(value).toLocaleString() : '-'
    }
  ];

  return (
    <div className="transactions-page">
      <ParticleBackground />

      <div className="transactions-container">
        <div className="transactions-header">
          <div className="t-title">
            <h1>Transaction History</h1>
            <p className="t-desc">View all your deposits, withdrawals, and trades</p>
          </div>

          {/* Filters */}
          <div className="transactions-filters">
            {["All", "Deposit", "Withdrawal", "Trade"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-btn ${filter === f ? "active" : ""}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="transactions-content">
            {filteredData.length > 0 ? (
              <DataTable columns={columns} data={filteredData} />
            ) : (
              <div className="empty-state-tx">
                <div className="empty-icon">📝</div>
                <p>No transactions found for this filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

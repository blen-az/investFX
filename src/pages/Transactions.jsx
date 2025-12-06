import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserTransactions } from "../services/transactionService";
import ParticleBackground from "../components/ParticleBackground";
import DataTable from "../components/DataTable";

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (user?.uid) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getUserTransactions(user.uid);
      setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

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
        const isTrade = row.type === 'Trade';
        // For trades, 0 PnL (loss) is effectively negative investment, but here we show net result
        // If trade is active, it's negative (cost). 

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
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 relative overflow-hidden">
      <ParticleBackground />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
              Transaction History
            </h1>
            <p className="text-gray-400 mt-2">View all your deposits, withdrawals, and trades</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4 md:mt-0 bg-gray-800/50 p-1 rounded-lg backdrop-blur-sm">
            {["All", "Deposit", "Withdrawal", "Trade"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                    ? "bg-yellow-500 text-black shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : (
          <div className="bg-gray-800/30 backdrop-blur-md rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl">
            {filteredData.length > 0 ? (
              <DataTable columns={columns} data={filteredData} />
            ) : (
              <div className="p-12 text-center text-gray-400">
                <div className="text-4xl mb-4">📝</div>
                <p>No transactions found for this filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

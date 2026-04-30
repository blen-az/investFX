// src/pages/admin/BalanceHistory.jsx
import React, { useState, useEffect, useCallback } from "react";
import DataTable from "../../components/DataTable";
import { getBalanceHistory } from "../../services/adminService";
import "./Users.css";

const OPERATION_LABELS = {
    set: "Set",
    add: "Add",
    subtract: "Subtract",
};

const OPERATION_COLORS = {
    set: "#6366f1",
    add: "#10b981",
    subtract: "#ef4444",
};

const TARGET_LABELS = {
    funding: "Funding",
    main: "Funding",
    trading: "Futures",
    futures: "Futures",
    spot: "Spot",
    earn: "Earn",
    contract: "Contract",
    fiat: "Fiat",
    commission: "Commission",
};

export default function BalanceHistory() {
    const [records, setRecords] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [operationFilter, setOperationFilter] = useState("all");
    const [targetFilter, setTargetFilter] = useState("all");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getBalanceHistory({ limitCount: 500 });
            setRecords(data);
            setFiltered(data);
        } catch (err) {
            console.error("Error loading balance history:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Apply filters whenever search/filter state changes
    useEffect(() => {
        let result = records;

        if (operationFilter !== "all") {
            result = result.filter(r => r.operation === operationFilter);
        }

        if (targetFilter !== "all") {
            result = result.filter(r => {
                const t = r.target?.toLowerCase() || "";
                if (targetFilter === "funding") return t === "funding" || t === "main";
                if (targetFilter === "futures") return t === "futures" || t === "trading";
                return t === targetFilter;
            });
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r =>
                (r.userEmail?.toLowerCase() || "").includes(q) ||
                (r.userName?.toLowerCase() || "").includes(q) ||
                (r.userId?.toLowerCase() || "").includes(q) ||
                (r.performedBy?.toLowerCase() || "").includes(q)
            );
        }

        setFiltered(result);
    }, [records, searchQuery, operationFilter, targetFilter]);

    const columns = [
        {
            header: "User",
            key: "userEmail",
            render: (value, row) => (
                <div>
                    <div style={{ fontWeight: 600, color: "#f8fafc", fontSize: "13px" }}>
                        {value || row.userId}
                    </div>
                    {row.userName && row.userName !== "Unknown" && (
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>{row.userName}</div>
                    )}
                </div>
            )
        },
        {
            header: "Operation",
            key: "operation",
            render: (value) => (
                <span style={{
                    background: `${OPERATION_COLORS[value] || "#6366f1"}22`,
                    color: OPERATION_COLORS[value] || "#6366f1",
                    border: `1px solid ${OPERATION_COLORS[value] || "#6366f1"}44`,
                    padding: "2px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 600,
                }}>
                    {OPERATION_LABELS[value] || value}
                </span>
            )
        },
        {
            header: "Wallet",
            key: "target",
            render: (value) => (
                <span className="badge badge-info">
                    {TARGET_LABELS[value?.toLowerCase()] || value}
                </span>
            )
        },
        {
            header: "Amount",
            key: "amount",
            render: (value, row) => {
                const color = row.operation === "add" ? "#10b981"
                    : row.operation === "subtract" ? "#ef4444"
                        : "#6366f1";
                const prefix = row.operation === "add" ? "+" : row.operation === "subtract" ? "-" : "";
                return (
                    <span style={{ color, fontWeight: 600 }}>
                        {prefix}${Number(value)?.toFixed(2)}
                    </span>
                );
            }
        },
        {
            header: "New Balance",
            key: "newBalance",
            render: (value) =>
                value != null
                    ? <span style={{ color: "#06b6d4", fontWeight: 600 }}>${Number(value).toFixed(2)}</span>
                    : <span style={{ color: "#64748b" }}>—</span>
        },
        {
            header: "Done By",
            key: "performedBy",
            render: (value, row) => (
                <div>
                    <div style={{ fontSize: "12px", color: "#f8fafc" }}>{value || "admin"}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {row.performedByRole || "admin"}
                    </div>
                </div>
            )
        },
        {
            header: "Date",
            key: "createdAt",
            render: (value) =>
                value
                    ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                    : "—"
        }
    ];


    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">Balance History</h1>
                    <p className="page-subtitle">
                        Audit log of all balance changes made by admins or agents ({filtered.length} records)
                    </p>
                </div>
                <button
                    onClick={load}
                    className="action-btn action-btn-secondary"
                    style={{ padding: "8px 16px", fontSize: "13px", alignSelf: "center" }}
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Filters row */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                {/* Search */}
                <div className="search-bar glass-card" style={{ flex: "1 1 260px", minWidth: 0, marginBottom: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by user, email, or done by…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="search-clear" title="Clear">✕</button>
                    )}
                </div>

                {/* Operation filter */}
                <select
                    className="form-input"
                    value={operationFilter}
                    onChange={e => setOperationFilter(e.target.value)}
                    style={{ flex: "0 0 140px", padding: "9px 12px", fontSize: "13px" }}
                >
                    <option value="all">All Operations</option>
                    <option value="set">Set</option>
                    <option value="add">Add</option>
                    <option value="subtract">Subtract</option>
                </select>

                {/* Wallet target filter */}
                <select
                    className="form-input"
                    value={targetFilter}
                    onChange={e => setTargetFilter(e.target.value)}
                    style={{ flex: "0 0 150px", padding: "9px 12px", fontSize: "13px" }}
                >
                    <option value="all">All Wallets</option>
                    <option value="funding">Funding</option>
                    <option value="futures">Futures</option>
                    <option value="spot">Spot</option>
                    <option value="earn">Earn</option>
                    <option value="contract">Contract</option>
                    <option value="fiat">Fiat</option>
                    <option value="commission">Commission</option>
                </select>
            </div>

            {loading ? (
                <div className="loading-state">Loading balance history…</div>
            ) : filtered.length === 0 ? (
                <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                    <h3 style={{ color: "#f8fafc", marginBottom: "8px" }}>No Records Found</h3>
                    <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                        Balance adjustments will appear here once they are made.
                    </p>
                </div>
            ) : (
                <DataTable columns={columns} data={filtered} />
            )}
        </div>
    );
}

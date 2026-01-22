// src/pages/agent/AgentWithdraw.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { requestWithdrawal, getWithdrawalHistory, getWithdrawalStats } from "../../services/withdrawalService";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import DataTable from "../../components/DataTable";
import AgentLayout from "./AgentLayout";
import "./AgentWithdraw.css";

export default function AgentWithdraw() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [commissionBalance, setCommissionBalance] = useState(0);
    const [withdrawals, setWithdrawals] = useState([]);
    const [stats, setStats] = useState({
        totalWithdrawn: 0,
        pendingWithdrawals: 0,
        thisMonthWithdrawn: 0
    });

    // Form state
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
    const [paymentDetails, setPaymentDetails] = useState({
        accountName: "",
        accountNumber: "",
        bankName: "",
        swiftCode: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadData = React.useCallback(async () => {
        try {
            setLoading(true);

            // Fetch commission balance
            const walletRef = doc(db, "wallets", user.uid);
            const walletSnap = await getDoc(walletRef);
            if (walletSnap.exists()) {
                setCommissionBalance(walletSnap.data().commissionBalance || 0);
            }

            // Fetch withdrawal history
            const history = await getWithdrawalHistory(user.uid);
            setWithdrawals(history);

            // Fetch stats
            const withdrawalStats = await getWithdrawalStats(user.uid);
            setStats(withdrawalStats);
        } catch (err) {
            console.error("Error loading withdrawal data:", err);
            setError("Failed to load withdrawal data");
        } finally {
            setLoading(false);
        }
    }, [user.uid]);

    useEffect(() => {
        if (user?.uid) {
            loadData();
        }
    }, [user, loadData]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const withdrawAmount = parseFloat(amount);

        // Validation
        if (!withdrawAmount || withdrawAmount <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        if (withdrawAmount < 10) {
            setError("Minimum withdrawal amount is $10");
            return;
        }

        if (withdrawAmount > commissionBalance) {
            setError(`Insufficient balance. Available: $${commissionBalance.toFixed(2)}`);
            return;
        }

        if (paymentMethod === "bank_transfer" && (!paymentDetails.accountNumber || !paymentDetails.bankName)) {
            setError("Please provide complete bank details");
            return;
        }

        if (paymentMethod === "paypal" && !paymentDetails.email) {
            setError("Please provide PayPal email");
            return;
        }

        try {
            setSubmitting(true);
            await requestWithdrawal(user.uid, withdrawAmount, paymentMethod, paymentDetails);
            setSuccess(`Withdrawal request for $${withdrawAmount.toFixed(2)} submitted successfully!`);

            // Reset form
            setAmount("");
            setPaymentDetails({
                accountName: "",
                accountNumber: "",
                bankName: "",
                swiftCode: "",
                email: ""
            });

            // Reload data
            await loadData();
        } catch (err) {
            setError(err.message || "Failed to submit withdrawal request");
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            header: "Date",
            key: "requestedAt",
            render: (value) => value ? new Date(value).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-'
        },
        {
            header: "Amount",
            key: "amount",
            render: (value) => (
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                    ${value?.toFixed(2) || '0.00'}
                </span>
            )
        },
        {
            header: "Method",
            key: "paymentMethod",
            render: (value) => value.replace('_', ' ').toUpperCase()
        },
        {
            header: "Status",
            key: "status",
            render: (value) => {
                const statusColors = {
                    pending: { bg: 'rgba(234, 179, 8, 0.2)', border: 'rgba(234, 179, 8, 0.4)', color: '#eab308' },
                    approved: { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.4)', color: '#22c55e' },
                    rejected: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' },
                    completed: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }
                };
                const style = statusColors[value] || statusColors.pending;

                return (
                    <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        color: style.color
                    }}>
                        {value.toUpperCase()}
                    </span>
                );
            }
        },
        {
            header: "Processed",
            key: "processedAt",
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
    ];

    const availableBalance = commissionBalance - stats.pendingWithdrawals;

    if (loading) {
        return (
            <div className="agent-withdraw-page">
                <div className="loading-state">Loading...</div>
            </div>
        );
    }

    return (
        <AgentLayout>
            <div className="agent-withdraw-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title gradient-text">Withdraw Earnings</h1>
                        <p className="page-subtitle">Request withdrawal of your commission earnings</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="withdraw-stats-grid">
                    <div className="stat-card glass-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <div className="stat-label">Commission Balance</div>
                            <div className="stat-value">${commissionBalance.toFixed(2)}</div>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                            <div className="stat-label">Pending Withdrawals</div>
                            <div className="stat-value">${stats.pendingWithdrawals.toFixed(2)}</div>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <div className="stat-label">Available to Withdraw</div>
                            <div className="stat-value" style={{ color: '#10b981' }}>
                                ${availableBalance.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <div className="stat-label">This Month Withdrawn</div>
                            <div className="stat-value">${stats.thisMonthWithdrawn.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Form */}
                <div className="withdrawal-form-card glass-card">
                    <h2 style={{ marginBottom: '20px', color: '#f8fafc' }}>Request Withdrawal</h2>

                    {error && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            borderRadius: '8px',
                            color: '#10b981',
                            marginBottom: '16px'
                        }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Withdrawal Amount *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="10"
                                max={availableBalance}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount (min $10)"
                                className="form-input"
                            />
                            <small style={{ color: '#94a3b8', fontSize: '12px' }}>
                                Available: ${availableBalance.toFixed(2)} | Min: $10 | Max: $10,000
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Payment Method *</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="form-input"
                            >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="paypal">PayPal</option>
                                <option value="crypto">Cryptocurrency</option>
                            </select>
                        </div>

                        {paymentMethod === "bank_transfer" && (
                            <>
                                <div className="form-group">
                                    <label>Account Name *</label>
                                    <input
                                        type="text"
                                        value={paymentDetails.accountName}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, accountName: e.target.value })}
                                        placeholder="Account holder name"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Account Number *</label>
                                    <input
                                        type="text"
                                        value={paymentDetails.accountNumber}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                                        placeholder="Account number"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bank Name *</label>
                                    <input
                                        type="text"
                                        value={paymentDetails.bankName}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                                        placeholder="Bank name"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SWIFT/BIC Code (Optional)</label>
                                    <input
                                        type="text"
                                        value={paymentDetails.swiftCode}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, swiftCode: e.target.value })}
                                        placeholder="SWIFT code for international transfers"
                                        className="form-input"
                                    />
                                </div>
                            </>
                        )}

                        {paymentMethod === "paypal" && (
                            <div className="form-group">
                                <label>PayPal Email *</label>
                                <input
                                    type="email"
                                    value={paymentDetails.email}
                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, email: e.target.value })}
                                    placeholder="your.email@example.com"
                                    className="form-input"
                                />
                            </div>
                        )}

                        {paymentMethod === "crypto" && (
                            <div className="form-group">
                                <label>Wallet Address *</label>
                                <input
                                    type="text"
                                    value={paymentDetails.walletAddress}
                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, walletAddress: e.target.value })}
                                    placeholder="Your cryptocurrency wallet address"
                                    className="form-input"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || availableBalance < 10}
                            className="submit-btn"
                        >
                            {submitting ? "Submitting..." : "Request Withdrawal"}
                        </button>
                    </form>
                </div>

                {/* Withdrawal History */}
                <div className="section-header">
                    <h2 className="section-title">Withdrawal History</h2>
                </div>

                {withdrawals.length === 0 ? (
                    <div className="empty-state-card glass-card">
                        <div className="empty-icon">💸</div>
                        <h3>No Withdrawals Yet</h3>
                        <p>Your withdrawal requests will appear here</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={withdrawals} />
                )}
            </div>
        </AgentLayout>
    );
}

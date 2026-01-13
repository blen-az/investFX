import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { getReferredUsers, generateReferralLink, getAgentReferralCode, setReferredUserTradeControl } from "../../services/agentService";
import AgentLayout from "./AgentLayout";
import "./Referrals.css";

export default function Referrals() {
    const { user } = useAuth();
    const [referredUsers, setReferredUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [referralLink, setReferralLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [showTradeControlModal, setShowTradeControlModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [tradeControl, setTradeControl] = useState("auto");

    useEffect(() => {
        if (user?.uid) {
            loadAgentData();
        }
    }, [user]);

    // Filter users whenever search query or users list changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(referredUsers);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = referredUsers.filter(refUser =>
                refUser.name?.toLowerCase().includes(query) ||
                refUser.email?.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered);
        }
    }, [searchQuery, referredUsers]);

    const loadAgentData = async () => {
        try {
            setLoading(true);
            // Get referral code first
            const code = await getAgentReferralCode(user.uid);
            if (code) {
                const link = generateReferralLink(code);
                setReferralLink(link);
            }
            // Then load referred users
            const referred = await getReferredUsers(user.uid);
            setReferredUsers(referred);
            setFilteredUsers(referred);
        } catch (error) {
            console.error("Error loading agent data:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyReferralLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleManageUser = (userRow) => {
        setSelectedUser(userRow);
        setTradeControl(userRow.tradeControl || "auto");
        setShowTradeControlModal(true);
    };

    const handleSaveTradeControl = async () => {
        try {
            await setReferredUserTradeControl(user.uid, selectedUser.id, tradeControl);
            setShowTradeControlModal(false);
            alert("✅ Trade control updated successfully!");
            // Reload data
            await loadAgentData();
        } catch (error) {
            console.error("Error updating trade control:", error);
            alert(`❌ Failed to update trade control: ${error.message}`);
        }
    };

    const columns = [
        {
            header: "Name",
            key: "name",
            render: (value, row) => (
                <div>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{value || row.email.split('@')[0]}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{row.email}</div>
                </div>
            )
        },
        {
            header: "Balance",
            key: "balance",
            render: (value) => `$${value?.toFixed(2) || '0.00'}`
        },
        {
            header: "Trade Control",
            key: "tradeControl",
            render: (value) => {
                const displayValue = value || "auto";
                let badgeClass = "badge-info";
                if (displayValue === "force_win") badgeClass = "badge-success";
                if (displayValue === "force_loss") badgeClass = "badge-danger";

                return (
                    <span className={`badge ${badgeClass}`}>
                        {displayValue === "force_win" ? "Force Win" :
                            displayValue === "force_loss" ? "Force Loss" : "Auto"}
                    </span>
                );
            }
        },
        {
            header: "Status",
            key: "frozen",
            render: (value) => (
                <span className={`badge ${value ? 'badge-danger' : 'badge-success'}`}>
                    {value ? 'Frozen' : 'Active'}
                </span>
            )
        },
        {
            header: "Joined",
            key: "createdAt",
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
    ];

    const actions = (row) => (
        <button
            className="action-btn action-btn-primary"
            onClick={() => handleManageUser(row)}
            style={{ fontSize: '13px', padding: '6px 12px' }}
        >
            Manage
        </button>
    );

    if (loading) {
        return (
            <div className="referrals-page">
                <div className="loading-state">Loading referrals...</div>
            </div>
        );
    }

    return (
        <AgentLayout>
            <div className="referrals-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title gradient-text">My Referrals</h1>
                        <p className="page-subtitle">Users you've referred to the platform</p>
                    </div>
                    <div className="header-stats">
                        <div className="stat-item">
                            <span className="stat-label">Total Referrals</span>
                            <span className="stat-value">{referredUsers.length}</span>
                        </div>
                        {searchQuery && (
                            <div className="stat-item">
                                <span className="stat-label">Filtered</span>
                                <span className="stat-value" style={{ color: '#06b6d4' }}>{filteredUsers.length}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Referral Link Card */}
                <div className="referral-card glass-card">
                    <div className="referral-header">
                        <div className="referral-icon">🔗</div>
                        <div>
                            <h2 className="referral-title">Your Referral Link</h2>
                            <p className="referral-subtitle">Share this link to earn 40% commission</p>
                        </div>
                    </div>

                    <div className="referral-link-box">
                        <input
                            type="text"
                            value={referralLink}
                            readOnly
                            className="referral-input"
                        />
                        <button onClick={copyReferralLink} className="copy-btn">
                            {copied ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.6018 3.08839C16.2171 2.71211 15.7016 2.5 15.1634 2.5H10C8.89543 2.5 8 3.39543 8 4.5V4Z" stroke="currentColor" strokeWidth="2" />
                                        <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="search-bar glass-card" style={{ marginBottom: '24px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="search-clear"
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Referred Users Table */}
                <div className="section-header">
                    <h2 className="section-title">Referred Users</h2>
                </div>

                {filteredUsers.length === 0 ? (
                    <div className="empty-state-card glass-card">
                        <div className="empty-icon">👥</div>
                        <h3>{searchQuery ? 'No Results Found' : 'No Referrals Yet'}</h3>
                        <p>{searchQuery ? 'Try a different search term' : 'Share your referral link to start earning commissions'}</p>
                        {!searchQuery && (
                            <button onClick={copyReferralLink} className="btn btn-primary" style={{ marginTop: '16px' }}>
                                Copy Referral Link
                            </button>
                        )}
                    </div>
                ) : (
                    <DataTable columns={columns} data={filteredUsers} actions={actions} />
                )}

                {/* Trade Control Modal */}
                <Modal
                    isOpen={showTradeControlModal}
                    onClose={() => setShowTradeControlModal(false)}
                    title="Manage Trade Control"
                >
                    <div className="modal-content">
                        <div className="form-group">
                            <label className="form-label">User</label>
                            <div className="user-info-display">
                                {selectedUser?.name || selectedUser?.email}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Trade Control</label>
                            <select
                                className="form-input"
                                value={tradeControl}
                                onChange={(e) => setTradeControl(e.target.value)}
                            >
                                <option value="auto">Auto (Normal Trading)</option>
                                <option value="force_win">Force Win</option>
                                <option value="force_loss">Force Loss</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <div style={{
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '8px',
                                padding: '12px',
                                color: '#f59e0b',
                                fontSize: '13px'
                            }}>
                                ⚠️ <strong>Note:</strong> This will affect all future trades for this user until changed back to Auto.
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowTradeControlModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveTradeControl}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AgentLayout>
    );
}

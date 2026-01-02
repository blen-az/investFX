// src/pages/admin/Users.jsx
import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import { getAllUsers, setUserBalance, freezeUser, assignUserToAgent, getAllAgents } from "../../services/adminService";
import { setUserTradeControl } from "../../services/tradeSettingsService";
import "./Users.css";


export default function Users() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [balanceAmount, setBalanceAmount] = useState("");
    const [balanceOperation, setBalanceOperation] = useState("set");
    const [balanceTarget, setBalanceTarget] = useState("funding");

    const [showAgentModal, setShowAgentModal] = useState(false);
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState("");
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    // Filter users whenever search query or users list changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = users.filter(user =>
                user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.role?.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
            setFilteredUsers(data);
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFreezeUser = async (userId, freeze) => {
        try {
            await freezeUser(userId, freeze);
            await loadUsers();
        } catch (error) {
            console.error("Error freezing user:", error);
        }
    };

    const handleSetBalance = async () => {
        try {
            const amount = parseFloat(balanceAmount);
            if (isNaN(amount) || amount < 0) {
                alert("Please enter a valid amount");
                return;
            }

            await setUserBalance(selectedUser.id, amount, balanceOperation, balanceTarget);
            setShowBalanceModal(false);
            setBalanceAmount("");
            await loadUsers();

            // Show success message
            const operationText = balanceOperation === "set" ? "set to" :
                balanceOperation === "add" ? "increased by" : "decreased by";
            alert(`✅ Balance ${operationText} $${amount.toFixed(2)} successfully!`);
        } catch (error) {
            console.error("Error setting balance:", error);
            alert(`❌ Failed to update balance: ${error.message}`);
        }
    };

    const handleAssignAgent = async () => {
        try {
            if (!selectedUser || !selectedAgent) {
                alert("Please select both a user and an agent.");
                return;
            }

            console.log(`Assigning user ${selectedUser.id} to agent ${selectedAgent}...`);
            await assignUserToAgent(selectedUser.id, selectedAgent);

            setShowAgentModal(false);
            setSelectedAgent("");
            await loadUsers();
            alert("✅ User assigned to agent successfully!");
        } catch (error) {
            console.error("Error assigning agent:", error);
            // Show specific error message
            if (error.code === 'permission-denied') {
                alert("❌ Permission Denied: You do not have permission to perform this action. Check your admin privileges.");
            } else {
                alert(`❌ Failed to assign agent: ${error.message}`);
            }
        }
    };

    const openAgentModal = async (user) => {
        setSelectedUser(user);
        try {
            console.log("Fetching agents list...");
            const agentList = await getAllAgents();
            console.log(`Found ${agentList.length} agents.`);
            setAgents(agentList);
            setShowAgentModal(true);
        } catch (error) {
            console.error("Error loading agents:", error);
            if (error.code === 'permission-denied') {
                alert("❌ Permission Denied: Cannot fetch agents list.");
            } else {
                alert(`❌ Failed to load agents list: ${error.message}`);
            }
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
            header: "Role",
            key: "role",
            render: (value) => (
                <span className={`badge badge-${value}`}>
                    {value}
                </span>
            )
        },
        {
            header: "Balance",
            key: "balance",
            render: (value) => `$${value?.toFixed(2) || '0.00'}`
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
        <>
            <button
                className="action-btn"
                style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                onClick={() => {
                    setSelectedUser(row);
                    setShowDetailsModal(true);
                }}
            >
                View Details
            </button>
            <button
                className="action-btn action-btn-primary"
                onClick={() => {
                    setSelectedUser(row);
                    setShowBalanceModal(true);
                }}
            >
                Set Balance
            </button>
            <button
                className="action-btn"
                style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' }}
                onClick={() => openAgentModal(row)}
            >
                Assign Agent
            </button>
            <button
                className={`action-btn ${row.frozen ? 'action-btn-success' : 'action-btn-danger'}`}
                onClick={() => handleFreezeUser(row.id, !row.frozen)}
            >
                {row.frozen ? 'Unfreeze' : 'Freeze'}
            </button>
        </>
    );

    if (loading) {
        return (
            <div className="users-page">
                <div className="loading-state">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">User Management</h1>
                    <p className="page-subtitle">Manage all platform users</p>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total Users</span>
                        <span className="stat-value">{users.length}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">{searchQuery ? 'Filtered' : 'Agents'}</span>
                        <span className="stat-value" style={{ color: searchQuery ? '#06b6d4' : '#10b981' }}>
                            {searchQuery ? filteredUsers.length : users.filter(u => u.role === 'agent').length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-bar glass-card" style={{ marginBottom: '24px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                    type="text"
                    placeholder="Search users by name, email, or role..."
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

            <DataTable columns={columns} data={filteredUsers} actions={actions} />

            {/* Balance Modal */}
            <Modal
                isOpen={showBalanceModal}
                onClose={() => setShowBalanceModal(false)}
                title="Set User Balance"
            >
                <div className="modal-content">
                    <div className="form-group">
                        <label className="form-label">User</label>
                        <div className="user-info-display">
                            {selectedUser?.name || selectedUser?.email}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Target Wallet</label>
                        <select
                            className="form-input"
                            value={balanceTarget}
                            onChange={(e) => setBalanceTarget(e.target.value)}
                        >
                            <option value="funding">Funding Account</option>
                            <option value="spot">Spot Account</option>
                            <option value="futures">Futures Account</option>
                            <option value="earn">Earn Account</option>
                            <option value="contract">Contract Account</option>
                            <option value="fiat">Fiat Account</option>
                            <option value="commission">Commission Account</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Current Balance ({balanceTarget})</label>
                        <div className="user-info-display" style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#10b981'
                        }}>
                            ${(() => {
                                if (!selectedUser) return '0.00';
                                // Map target to property name in user object (which comes from getAllUsers)
                                // Note: getAllUsers currently only returns main and trading balances flattened.
                                // We might need to look at specific props if they exist, or rely on what's available.
                                // The User object from getAllUsers is populated with: balance (main+trading), mainBalance, tradingBalance, commissionBalance.
                                // Spot/Earn etc might be missing from the list view data if not added to getAllUsers.
                                // For now, we show what we have or 0 if unknown in the list view, 
                                // BUT the operation will work correctly on backend.

                                switch (balanceTarget) {
                                    case 'funding': return selectedUser.mainBalance?.toFixed(2) || '0.00';
                                    case 'futures': return selectedUser.tradingBalance?.toFixed(2) || '0.00';
                                    case 'commission': return selectedUser.commissionBalance?.toFixed(2) || '0.00';
                                    default: return '---'; // Other balances not fetched in list view yet
                                }
                            })()}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Operation</label>
                        <select
                            className="form-input"
                            value={balanceOperation}
                            onChange={(e) => setBalanceOperation(e.target.value)}
                        >
                            <option value="set">Set Balance</option>
                            <option value="add">Add to Balance</option>
                            <option value="subtract">Subtract from Balance</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Amount ($)</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="Enter amount"
                            value={balanceAmount}
                            onChange={(e) => setBalanceAmount(e.target.value)}
                            step="0.01"
                            min="0"
                        />
                    </div>

                    {balanceAmount && !isNaN(parseFloat(balanceAmount)) && (
                        <div className="form-group">
                            <label className="form-label">New Balance Preview</label>
                            <div className="user-info-display" style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#06b6d4'
                            }}>
                                {(() => {
                                    let current = 0;
                                    switch (balanceTarget) {
                                        case 'funding': current = selectedUser?.mainBalance || 0; break;
                                        case 'futures': current = selectedUser?.tradingBalance || 0; break;
                                        case 'commission': current = selectedUser?.commissionBalance || 0; break;
                                        default: current = 0; // Assume 0 if not visible
                                    }

                                    const amount = parseFloat(balanceAmount);
                                    if (balanceOperation === "set") return amount.toFixed(2);
                                    if (balanceOperation === "add") return (current + amount).toFixed(2);
                                    if (balanceOperation === "subtract") return Math.max(0, current - amount).toFixed(2);
                                    return current.toFixed(2);
                                })()}
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowBalanceModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSetBalance}
                            disabled={!balanceAmount}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Agent Assignment Modal */}
            <Modal
                isOpen={showAgentModal}
                onClose={() => setShowAgentModal(false)}
                title="Assign Agent"
            >
                <div className="modal-content">
                    <div className="form-group">
                        <label className="form-label">User</label>
                        <div className="user-info-display">
                            {selectedUser?.name || selectedUser?.email}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Select Agent</label>
                        <select
                            className="form-input"
                            value={selectedAgent}
                            onChange={(e) => setSelectedAgent(e.target.value)}
                        >
                            <option value="">-- Select an Agent --</option>
                            {agents.map(agent => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name || agent.email} ({agent.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowAgentModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleAssignAgent}
                            disabled={!selectedAgent}
                        >
                            Assign Agent
                        </button>
                    </div>
                </div>
            </Modal>

            {/* User Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                title="User Details"
            >
                <div className="modal-content">
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <div className="user-info-display">
                            {selectedUser?.name || selectedUser?.email?.split('@')[0]}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <div className="user-info-display">
                            {selectedUser?.email}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <div className="user-info-display">
                            <span className={`badge badge-${selectedUser?.role}`}>
                                {selectedUser?.role}
                            </span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Balance</label>
                        <div className="user-info-display">
                            ${selectedUser?.balance?.toFixed(2) || '0.00'}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Referred By</label>
                        <div className="user-info-display">
                            {selectedUser?.referredBy ? (
                                <span className="badge badge-agent">
                                    {users.find(u => u.id === selectedUser.referredBy)?.name ||
                                        users.find(u => u.id === selectedUser.referredBy)?.email ||
                                        'Unknown Agent'}
                                </span>
                            ) : (
                                <span style={{ color: '#64748b' }}>Direct signup</span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Trade Control</label>
                        <select
                            className="form-input"
                            value={selectedUser?.tradeControl || 'auto'}
                            onChange={async (e) => {
                                try {
                                    await setUserTradeControl(selectedUser.id, e.target.value);
                                    await loadUsers();
                                    setSelectedUser({ ...selectedUser, tradeControl: e.target.value });
                                } catch (error) {
                                    console.error("Error setting trade control:", error);
                                }
                            }}
                        >
                            <option value="auto">Auto</option>
                            <option value="force_win">Force Win</option>
                            <option value="force_loss">Force Loss</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Account Status</label>
                        <div className="user-info-display">
                            <span className={`badge ${selectedUser?.frozen ? 'badge-danger' : 'badge-success'}`}>
                                {selectedUser?.frozen ? 'Frozen' : 'Active'}
                            </span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">KYC Status</label>
                        <div className="user-info-display">
                            {(() => {
                                const status = selectedUser?.verification?.status || selectedUser?.kycStatus;
                                if (!status || status === 'unverified') return <span style={{ color: '#64748b' }}>Not submitted</span>;

                                return (
                                    <span className={`badge ${status === 'verified' ? 'badge-success' :
                                        status === 'pending' ? 'badge-warning' :
                                            'badge-danger'}`}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>

                    {(selectedUser?.verification?.idFrontUrl || selectedUser?.idUrl) && (
                        <div className="form-group">
                            <label className="form-label">ID Documents</label>
                            <div className="user-info-display" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {/* Front/Legacy ID */}
                                <a
                                    href={selectedUser.verification?.idFrontUrl || selectedUser.idUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                    📄 {selectedUser.verification?.idBackUrl ? 'View Front ID' : 'View ID Document'}
                                </a>

                                {/* Back ID (if exists) */}
                                {selectedUser.verification?.idBackUrl && (
                                    <a
                                        href={selectedUser.verification.idBackUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                    >
                                        📄 View Back ID
                                    </a>
                                )}

                                {selectedUser.kycSubmittedAt && (
                                    <div style={{ marginTop: '4px', width: '100%', fontSize: '11px', color: '#64748b' }}>
                                        Submitted: {new Date(selectedUser.kycSubmittedAt).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Joined</label>
                        <div className="user-info-display">
                            {selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '-'}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowDetailsModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

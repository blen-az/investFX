import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AgentSidebar.css';

const AgentSidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { logout } = useAuth();

    // State for expandable menus
    const [expanded, setExpanded] = useState({
        users: true,
        orders: false,
        finance: false
    });

    const toggleMenu = (menu) => {
        setExpanded(prev => ({
            ...prev,
            [menu]: !prev[menu]
        }));
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* Mobile Backdrop */}
            <div className={`sidebar-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}></div>

            <div className={`agent-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">Admin System</div>
                </div>

                <div className="sidebar-content">
                    {/* Dashboard */}
                    <div className="menu-group">
                        <Link to="/agent/dashboard" className={`menu-item ${isActive('/agent/dashboard') ? 'active' : ''}`}>
                            <span className="menu-icon">🏠</span>
                            <span className="menu-text">Home</span>
                        </Link>
                    </div>

                    {/* Chat with Users */}
                    <div className="menu-group">
                        <Link to="/agent/chats" className={`menu-item ${isActive('/agent/chats') ? 'active' : ''}`}>
                            <span className="menu-icon">💬</span>
                            <span className="menu-text">Chats</span>
                        </Link>
                    </div>

                    {/* User Management */}
                    <div className="menu-group">
                        <div className="menu-item has-submenu" onClick={() => toggleMenu('users')}>
                            <span className="menu-icon">👥</span>
                            <span className="menu-text">User Management</span>
                            <span className={`arrow ${expanded.users ? 'down' : ''}`}>▼</span>
                        </div>
                        {expanded.users && (
                            <div className="submenu">
                                <Link to="/agent/referrals" className={`submenu-item ${isActive('/agent/referrals') ? 'active' : ''}`}>
                                    User List
                                </Link>
                                <Link to="/agent/agents" className={`submenu-item ${isActive('/agent/agents') ? 'active' : ''}`}>
                                    Agent Management
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Order Management */}
                    <div className="menu-group">
                        <div className="menu-item has-submenu" onClick={() => toggleMenu('orders')}>
                            <span className="menu-icon">📄</span>
                            <span className="menu-text">Order Management</span>
                            <span className={`arrow ${expanded.orders ? 'down' : ''}`}>▼</span>
                        </div>
                        {expanded.orders && (
                            <div className="submenu">
                                <Link to="/agent/orders/delivery" className={`submenu-item ${isActive('/agent/orders/delivery') ? 'active' : ''}`}>
                                    Delivery Orders
                                </Link>
                                <Link to="/agent/orders/contract" className={`submenu-item ${isActive('/agent/orders/contract') ? 'active' : ''}`}>
                                    Contract Orders
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Finance Management */}
                    <div className="menu-group">
                        <div className="menu-item has-submenu" onClick={() => toggleMenu('finance')}>
                            <span className="menu-icon">💸</span>
                            <span className="menu-text">Finance</span>
                            <span className={`arrow ${expanded.finance ? 'down' : ''}`}>▼</span>
                        </div>
                        {expanded.finance && (
                            <div className="submenu">
                                <Link to="/agent/deposits" className={`submenu-item ${isActive('/agent/deposits') ? 'active' : ''}`}>
                                    User Deposits
                                </Link>
                                <Link to="/agent/withdrawals" className={`submenu-item ${isActive('/agent/withdrawals') ? 'active' : ''}`}>
                                    User Withdrawals
                                </Link>
                                <Link to="/agent/withdraw" className={`submenu-item ${isActive('/agent/withdraw') ? 'active' : ''}`}>
                                    My Withdrawals
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <div className="menu-group">
                        <Link to="/agent/settings" className={`menu-item ${isActive('/agent/settings') ? 'active' : ''}`}>
                            <span className="menu-icon">⚙️</span>
                            <span className="menu-text">Settings</span>
                        </Link>
                    </div>

                    {/* Logout */}
                    <div className="menu-group mt-auto">
                        <div className="menu-item" onClick={logout} style={{ cursor: 'pointer', color: '#ff4d4d' }}>
                            <span className="menu-icon">🚪</span>
                            <span className="menu-text">Logout</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AgentSidebar;

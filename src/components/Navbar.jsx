import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, userRole, logout, isAdmin, isAgent } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* BRAND */}
        <Link to={user ? (isAdmin() ? "/admin/dashboard" : isAgent() ? "/agent/dashboard" : "/home") : "/"} className="brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">AvaTrade</span>
          {isAdmin() && <span className="role-badge admin-badge">ADMIN</span>}
          {isAgent() && !isAdmin() && <span className="role-badge agent-badge">AGENT</span>}
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="nav-links">
          {/* ADMIN NAVIGATION */}
          {isAdmin() && (
            <>
              <Link to="/admin/dashboard" className={`nav-link ${isActive("/admin/dashboard") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Dashboard
              </Link>

              <Link to="/admin/users" className={`nav-link ${isActive("/admin/users") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" />
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" />
                </svg>
                Users
              </Link>

              <Link to="/admin/deposits" className={`nav-link ${isActive("/admin/deposits") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" />
                </svg>
                Deposits
              </Link>

              <Link to="/admin/withdrawals" className={`nav-link ${isActive("/admin/withdrawals") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" />
                  <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 3V15" stroke="currentColor" strokeWidth="2" />
                </svg>
                Withdrawals
              </Link>
            </>
          )}

          {/* AGENT NAVIGATION */}
          {isAgent() && !isAdmin() && (
            <>
              <Link to="/agent/dashboard" className={`nav-link ${isActive("/agent/dashboard") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" />
                </svg>
                Dashboard
              </Link>

              <Link to="/agent/referrals" className={`nav-link ${isActive("/agent/referrals") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" />
                  <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 8V14M17 11H23" stroke="currentColor" strokeWidth="2" />
                </svg>
                Referrals
              </Link>

              <Link to="/agent/commissions" className={`nav-link ${isActive("/agent/commissions") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" />
                </svg>
                Commissions
              </Link>

              <Link to="/agent/chats" className={`nav-link ${isActive("/agent/chats") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Chats
              </Link>
            </>
          )}

          {/* REGULAR USER NAVIGATION */}
          {!isAdmin() && !isAgent() && user && (
            <>
              <Link to="/home" className={`nav-link ${isActive("/home") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" />
                </svg>
                Home
              </Link>

              <Link to="/trade" className={`nav-link ${isActive("/trade") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" />
                </svg>
                Trade
              </Link>

              <Link to="/transactions" className={`nav-link ${isActive("/transactions") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 12V16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 20H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16L9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 5L20 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                History
              </Link>

              <Link to="/wallet" className={`nav-link ${isActive("/wallet") ? "active" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20 12V8C20 6.89543 19.1046 6 18 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H18C19.1046 18 20 17.1046 20 16V14M20 12H14C12.8954 12 12 12.8954 12 14V14C12 15.1046 12.8954 16 14 16H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mine
              </Link>
            </>
          )}

          {/* PUBLIC LINKS */}
          {!user && (
            <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" />
              </svg>
              Home
            </Link>
          )}

          <Link to="/market" className={`nav-link ${isActive("/market") ? "active" : ""}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" />
            </svg>
            Market
          </Link>

          <Link to="/news" className={`nav-link ${isActive("/news") ? "active" : ""}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V18C21 19.1046 20.1046 20 19 20Z" stroke="currentColor" strokeWidth="2" />
              <path d="M7 8H17M7 12H17M7 16H13" stroke="currentColor" strokeWidth="2" />
            </svg>
            News
          </Link>

        </nav>

        {/* AUTH SECTION */}
        <div className="auth-section">
          {!user && (
            <>
              <Link to="/login" className="auth-btn login-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" />
                  <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" />
                  <path d="M15 12H3" stroke="currentColor" strokeWidth="2" />
                </svg>
                Login
              </Link>
              <Link to="/signup" className="auth-btn signup-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" />
                  <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 8V14M17 11H23" stroke="currentColor" strokeWidth="2" />
                </svg>
                Sign Up
              </Link>
            </>
          )}

          {user && (
            <>
              <div className="user-info">
                <div className="user-avatar">
                  {(user.displayName || user.email).charAt(0).toUpperCase()}
                </div>
                <span className="user-name-nav">
                  {user.displayName || user.email.split("@")[0]}
                </span>
              </div>

              <button onClick={handleLogout} className="auth-btn logout-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" />
                </svg>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Home, BarChart2, TrendingUp, Coins, History,
  Settings, HelpCircle, LogOut, User, Shield,
  LayoutDashboard, Users, ArrowDownCircle,
  ClipboardList, Wallet, DollarSign, ChevronDown
} from "lucide-react";

// ── User dropdown (shared between mobile + desktop) ──────────────
export function UserDropdownMenu({ anchorEl, onClose, navigate }) {
  const { user, logout, isAdmin, isAgent } = useAuth();
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [anchorEl]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
        !anchorEl?.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorEl, onClose]);

  const handleLogout = async () => {
    onClose();
    await logout();
    window.location.href = "/";
  };

  const go = (path) => { onClose(); navigate(path); };

  const displayName = user?.displayName || user?.name || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      className="user-dropdown-menu"
      style={{ position: "fixed", top: pos.top, right: pos.right }}
    >
      {/* Header */}
      <div className="dropdown-header">
        <div className="dropdown-avatar-row">
          <div className="dropdown-avatar">{initial}</div>
          <div>
            <div className="dropdown-name">{displayName}</div>
            <div className="dropdown-email">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Items */}
      {!isAdmin() && !isAgent() && (
        <>
          <button className="user-dropdown-item" onClick={() => go("/profile")}>
            <User size={15} /> Profile
          </button>
          <button className="user-dropdown-item" onClick={() => go("/security")}>
            <Shield size={15} /> Security
          </button>
          <button className="user-dropdown-item" onClick={() => go("/wallet")}>
            <Wallet size={15} /> Wallet
          </button>
          <button className="user-dropdown-item" onClick={() => go("/settings")}>
            <Settings size={15} /> Settings
          </button>
        </>
      )}

      <div className="dropdown-divider" />
      <button className="user-dropdown-item logout-item" onClick={handleLogout}>
        <LogOut size={15} /> Sign out
      </button>
    </div>,
    document.body
  );
}

// ── Desktop Sidebar ──────────────────────────────────────────────
function DesktopSidebar() {
  const { logout, isAdmin, isAgent } = useAuth();
  const navigate = useNavigate();

  const handleSidebarLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userLinks = [
    { to: "/home",         icon: <Home size={17} />,       label: "Home" },
    { to: "/market",       icon: <BarChart2 size={17} />,  label: "Market" },
    { to: "/trade",        icon: <TrendingUp size={17} />, label: "Trade" },
    { to: "/assets",       icon: <Coins size={17} />,      label: "Assets" },
    { to: "/transactions", icon: <History size={17} />,    label: "Activity" },
  ];

  const adminLinks = [
    { to: "/admin/dashboard",     icon: <LayoutDashboard size={17} />, label: "Dashboard" },
    { to: "/admin/users",         icon: <Users size={17} />,           label: "Users" },
    { to: "/admin/deposits",      icon: <ArrowDownCircle size={17} />, label: "Deposits" },
    { to: "/admin/withdrawals",   icon: <DollarSign size={17} />,      label: "Withdrawals" },
    { to: "/admin/agents",        icon: <Users size={17} />,           label: "Agents" },
    { to: "/admin/balance-history", icon: <ClipboardList size={17} />, label: "Bal. History" },
    { to: "/admin/settings",      icon: <Settings size={17} />,        label: "Settings" },
  ];

  const agentLinks = [
    { to: "/agent/dashboard",   icon: <LayoutDashboard size={17} />, label: "Dashboard" },
    { to: "/agent/referrals",   icon: <Users size={17} />,           label: "Referrals" },
    { to: "/agent/commissions", icon: <DollarSign size={17} />,      label: "Commissions" },
    { to: "/agent/chats",       icon: <History size={17} />,         label: "Chats" },
    { to: "/agent/settings",    icon: <Settings size={17} />,        label: "Settings" },
  ];

  const links = isAdmin() ? adminLinks : isAgent() ? agentLinks : userLinks;
  const homeLink = isAdmin() ? "/admin/dashboard" : isAgent() ? "/agent/dashboard" : "/home";

  return (
    <aside className="desktop-sidebar">
      <Link to={homeLink} className="sidebar-brand">
        <span className="sidebar-brand-icon">⚡</span>
        <span className="sidebar-brand-text">WayMore</span>
        {isAdmin() && <span className="role-badge admin-badge">ADMIN</span>}
        {isAgent() && !isAdmin() && <span className="role-badge agent-badge">AGENT</span>}
      </Link>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            {l.icon}
            {l.label}
          </NavLink>
        ))}

        {!isAdmin() && !isAgent() && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">Account</div>
            <NavLink to="/settings" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
              <Settings size={17} /> Settings
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
              <HelpCircle size={17} /> Support
            </NavLink>
          </>
        )}

        <div className="sidebar-divider" />
        <button
          onClick={handleSidebarLogout}
          className="sidebar-link logout-sidebar-btn"
          style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
        >
          <LogOut size={17} /> Logout
        </button>
      </nav>
    </aside>
  );
}

// ── Desktop Top Bar ──────────────────────────────────────────────
function DesktopTopBar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const btnRef = useRef(null);

  const pageMap = {
    "/home": "Dashboard",
    "/market": "Market",
    "/trade": "Trade",
    "/assets": "Assets",
    "/transactions": "Activity",
    "/deposit": "Deposit",
    "/withdraw": "Withdraw",
    "/profile": "Profile",
    "/settings": "Settings",
    "/security": "Security Center",
    "/wallet": "Wallet",
    "/verification": "Verification",
    "/chat": "Live Support",
    "/admin/dashboard": "Admin Dashboard",
    "/admin/users": "Users",
    "/admin/deposits": "Deposits",
    "/admin/withdrawals": "Withdrawals",
    "/admin/agents": "Agents",
    "/admin/settings": "Admin Settings",
    "/admin/balance-history": "Balance History",
    "/agent/dashboard": "Agent Dashboard",
    "/agent/referrals": "Referrals",
    "/agent/commissions": "Commissions",
    "/agent/chats": "Chats",
  };

  const pageTitle = pageMap[location.pathname] || "WayMore";
  const displayName = user?.displayName || user?.name || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="desktop-topbar">
      <div className="topbar-left">
        <h1 className="topbar-page-title">{pageTitle}</h1>
      </div>
      <div className="topbar-right">
        {user && (
          <>
            <button
              ref={btnRef}
              className="desktop-user-btn"
              onClick={() => setShowMenu(v => !v)}
            >
              <div className="desktop-avatar">{initial}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--wm-text)" }}>
                {displayName}
              </span>
              <ChevronDown size={13} style={{ color: "var(--wm-text-3)", transform: showMenu ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {showMenu && (
              <UserDropdownMenu
                anchorEl={btnRef.current}
                onClose={() => setShowMenu(false)}
                navigate={navigate}
              />
            )}
          </>
        )}
        {!user && (
          <Link to="/login" className="btn-primary" style={{ padding: "8px 18px", fontSize: 14 }}>
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

export { DesktopSidebar, DesktopTopBar };

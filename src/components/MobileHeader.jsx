import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserDropdownMenu } from "./Navbar";

export default function MobileHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const btnRef = useRef(null);

  if (!user) return null;

  const displayName = user?.displayName || user?.name || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="mobile-header">
        <div className="mobile-header-container">
          <Link to="/home" className="mobile-brand">
            <span className="mobile-brand-icon">⚡</span>
            <span className="mobile-brand-text">WayMore</span>
          </Link>

          <div className="mobile-header-actions">
            <button
              ref={btnRef}
              className="mobile-avatar-btn"
              onClick={() => setShowMenu(v => !v)}
              aria-label="Open profile menu"
            >
              {initial}
            </button>
          </div>
        </div>
      </header>

      {showMenu && (
        <UserDropdownMenu
          anchorEl={btnRef.current}
          onClose={() => setShowMenu(false)}
          navigate={navigate}
        />
      )}
    </>
  );
}

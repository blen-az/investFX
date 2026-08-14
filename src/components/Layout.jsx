import React from "react";
import { useLocation } from "react-router-dom";
import { DesktopSidebar, DesktopTopBar } from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";
import MobileHeader from "./MobileHeader";
import { useAuth } from "../contexts/AuthContext";

export default function Layout({ children }) {
  const location = useLocation();
  const { user, isAdmin, isAgent } = useAuth();

  const isTradePage = location.pathname === "/trade";
  const isAgentPage = location.pathname.startsWith("/agent");
  const isAdminPage = location.pathname.startsWith("/admin");
  const isAuthPage = ["/login", "/signup", "/forgot-password", "/"].includes(location.pathname);
  const isSpecialPage = isAgentPage || isAdminPage;

  // Auth / Landing pages — no shell
  if (isAuthPage) {
    return (
      <div className="app" style={{ background: "var(--wm-bg)" }}>
        {children}
      </div>
    );
  }

  // Admin / Agent pages — use original dark shell (Navbar hidden by CSS on mobile)
  if (isSpecialPage) {
    return (
      <div className="app">
        <DesktopSidebar />
        <DesktopTopBar />
        <div className="page-wrap">
          <div className={isTradePage ? "container-fluid" : "container"}>
            {children}
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  // Normal user pages
  return (
    <div className="app">
      {/* Desktop: sidebar + topbar */}
      <DesktopSidebar />
      <DesktopTopBar />

      {/* Mobile: top header */}
      <MobileHeader />

      {/* Content */}
      <div className="page-wrap">
        <div className={isTradePage ? "container-fluid" : "container"}>
          {children}
        </div>
      </div>

      {/* Mobile: floating bottom nav */}
      <MobileBottomNav />
    </div>
  );
}

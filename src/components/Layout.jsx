import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";

export default function Layout({ children }) {
  const location = useLocation();
  const isTradePage = location.pathname === "/trade";
  const isAgentPage = location.pathname.startsWith("/agent") || location.pathname.startsWith("/admin");

  return (
    <div className="app">
      {!isAgentPage && <Navbar />}
      <div className="page-wrap" style={isTradePage || isAgentPage ? { padding: 0 } : {}}>
        <div className={isTradePage || isAgentPage ? "container-fluid" : "container"}>
          {children}
        </div>
      </div>
      {!isAgentPage && <MobileBottomNav />}
    </div>
  );
}

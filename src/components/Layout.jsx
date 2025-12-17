import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";

export default function Layout({ children }) {
  const location = useLocation();
  const isTradePage = location.pathname === "/trade";

  return (
    <div className="app">
      <Navbar />
      <div className="page-wrap" style={isTradePage ? { padding: 0 } : {}}>
        <div className={isTradePage ? "container-fluid" : "container"}>
          {children}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}

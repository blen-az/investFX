// src/components/BottomNav.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./BottomNav.css"; // We'll include CSS inline below instructions

export default function BottomNav() {
  const loc = useLocation().pathname;

  return (
    <div className="bn-wrap">
      <div className="bn-inner">
        <Link className={`bn-item ${loc === "/" ? "active" : ""}`} to="/">
          <div className="bn-ico">🏠</div>
          <div className="bn-text">Home</div>
        </Link>

        <Link className={`bn-item ${loc.startsWith("/market") ? "active" : ""}`} to="/market">
          <div className="bn-ico">📊</div>
          <div className="bn-text">Market</div>
        </Link>

        <Link className={`bn-item ${loc.startsWith("/trade") ? "active" : ""}`} to="/trade">
          <div className="bn-ico">🔁</div>
          <div className="bn-text">Trade</div>
        </Link>

        <Link className={`bn-item ${loc.startsWith("/news") ? "active" : ""}`} to="/news">
          <div className="bn-ico">📰</div>
          <div className="bn-text">News</div>
        </Link>

        <Link className={`bn-item ${loc.startsWith("/profile") ? "active" : ""}`} to="/profile">
          <div className="bn-ico">👤</div>
          <div className="bn-text">Profile</div>
        </Link>
      </div>
    </div>
  );
}

// src/components/StatsCard.jsx
import React from "react";
import "./StatsCard.css";

export default function StatsCard({ icon, label, value, trend, trendValue, color = "cyan" }) {
    return (
        <div className={`stats-card glass-card stats-card-${color}`}>
            <div className="stats-icon" style={{ color: getColorValue(color) }}>
                {icon}
            </div>
            <div className="stats-content">
                <div className="stats-label">{label}</div>
                <div className="stats-value">{value}</div>
                {trend && (
                    <div className={`stats-trend ${trend}`}>
                        {trend === "up" ? "↑" : "↓"} {trendValue}
                    </div>
                )}
            </div>
        </div>
    );
}

function getColorValue(color) {
    const colors = {
        cyan: "#06b6d4",
        green: "#10b981",
        red: "#ef4444",
        yellow: "#f59e0b",
        blue: "#3b82f6"
    };
    return colors[color] || colors.cyan;
}

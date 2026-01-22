// src/components/MarketCard.jsx
import React from "react";

export default function MarketCard({ item, placeholder }) {
  if (placeholder) {
    return (
      <div className="market-card" style={{ background: "linear-gradient(90deg,#071017,#0b0f16)" }}>
        <div style={{ height: 140, borderRadius: 10 }} />
      </div>
    );
  }

  const title = item?.title || item?.title || "Crypto News";
  const src = item?.source || item?.source_info?.name || "Source";

  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="market-card" style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            📰
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#ffd700" }}>{Math.random() > 0.5 ? "TRENDING" : "BREAKING"}</div>
            <h4 style={{ margin: "6px 0 10px", fontSize: 18 }}>{title}</h4>
            <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.6)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 20 }}>🔥</span>
                <small>{src}</small>
              </div>
              <small>{item.published_on ? `${Math.floor((Date.now() / 1000 - item.published_on) / 60)}m ago` : ""}</small>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

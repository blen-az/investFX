// src/components/CryptoRow.jsx
import React from "react";

export default function CryptoRow({ c }) {
  const change = c.price_change_percentage_24h;
  return (
    <div className="crypto-row">
      <div className="crypto-left">
        <img src={c.image} alt={c.name} />
        <div>
          <div className="symbol">{c.symbol.toUpperCase()} / USDT</div>
          <div className="vol">Vol: {c.total_volume ? Number(c.total_volume).toLocaleString() : "—"}</div>
        </div>
      </div>

      <div className="crypto-right">
        <div className="price">${c.current_price ? Number(c.current_price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</div>
        <div className={`change ${change >= 0 ? "up" : "down"}`}>{change ? `${change.toFixed(2)}%` : "—"}</div>
      </div>
    </div>
  );
}

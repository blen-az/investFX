// src/components/OrderPanel.jsx
import React, { useState, useEffect } from "react";
import "./OrderPanel.css";

export default function OrderPanel({ coin, livePrice, onTrade }) {
  const [amount, setAmount] = useState("100");
  const [profitPercent, setProfitPercent] = useState(5);
  const [duration, setDuration] = useState("1m"); // 30s, 1m, 2m, 5m

  const quickAmounts = [100, 250, 500, 1000, 2500];
  const profitOptions = [5, 10, 15, 25, 35, 50];
  const durationOptions = [
    { label: "30s", value: "30s", desc: "Quick scalp" },
    { label: "1m", value: "1m", desc: "Standard" },
    { label: "2m", value: "2m", desc: "Medium" },
    { label: "5m", value: "5m", desc: "Extended" },
  ];

  const potentialProfit = (parseFloat(amount) || 0) * (profitPercent / 100);

  function handleTrade(side) {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid investment amount");
      return;
    }

    if (!livePrice || livePrice === 0) {
      alert("Waiting for price data... Please try again in a moment.");
      return;
    }

    if (onTrade) {
      onTrade({
        side,
        amount: parseFloat(amount),
        profitPercent,
        duration,
        entryPrice: livePrice,
        coin: coin
      });
    }
  }

  return (
    <div className="order-panel-container">
      {/* Investment Amount */}
      <div className="panel-section">
        <label className="section-label">Investment Amount</label>
        <div className="amount-input-box">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="amount-input"
            placeholder="0.00"
          />
          <button className="max-btn">MAX</button>
        </div>
        <div className="quick-amounts">
          {quickAmounts.map((val) => (
            <button
              key={val}
              className={`quick-amount-btn ${amount == val ? "active" : ""}`}
              onClick={() => setAmount(val.toString())}
            >
              ${val}
            </button>
          ))}
        </div>
      </div>

      {/* Profit Percentage */}
      <div className="panel-section">
        <label className="section-label">Profit Percentage</label>
        <div className="profit-options">
          {profitOptions.map((p) => (
            <button
              key={p}
              className={`profit-btn ${profitPercent === p ? "active" : ""}`}
              onClick={() => setProfitPercent(p)}
            >
              {p}%
            </button>
          ))}
          <button className="profit-btn custom">Custom</button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="info-grid">
        <div className="info-card">
          <span className="info-label">Entry Price</span>
          <span className="info-value" style={{ color: livePrice > 0 ? '#10b981' : '#94a3b8' }}>
            {livePrice > 0 ? `$${livePrice?.toLocaleString()}` : "Loading..."}
          </span>
        </div>
        <div className="info-card">
          <span className="info-label">Potential Profit</span>
          <span className="info-value positive">{profitPercent}%</span>
        </div>
      </div>

      {/* Trade Duration */}
      <div className="panel-section">
        <label className="section-label">Trade Duration</label>
        <div className="duration-options">
          {durationOptions.map((opt) => (
            <button
              key={opt.value}
              className={`duration-card ${duration === opt.value ? "active" : ""}`}
              onClick={() => setDuration(opt.value)}
            >
              <span className="duration-label">{opt.label}</span>
              <span className="duration-desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Box */}
      <div className="summary-box">
        <div className="summary-row">
          <span>Investment:</span>
          <span>${parseFloat(amount || 0).toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Potential Return:</span>
          <span className="positive">+${potentialProfit.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total if Win:</span>
          <span>${(parseFloat(amount || 0) + potentialProfit).toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="trade-action-btn buy"
          onClick={() => handleTrade("buy")}
          disabled={!livePrice || livePrice === 0}
          style={{ opacity: (!livePrice || livePrice === 0) ? 0.5 : 1 }}
        >
          <div className="btn-content">
            <span className="btn-label">Buy / Long</span>
            <span className="btn-arrow">↑</span>
          </div>
        </button>
        <button
          className="trade-action-btn sell"
          onClick={() => handleTrade("sell")}
          disabled={!livePrice || livePrice === 0}
          style={{ opacity: (!livePrice || livePrice === 0) ? 0.5 : 1 }}
        >
          <div className="btn-content">
            <span className="btn-label">Sell / Short</span>
            <span className="btn-arrow">↓</span>
          </div>
        </button>
      </div>
    </div>
  );
}

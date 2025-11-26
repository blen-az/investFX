// src/components/OrderPanel.jsx
import React, { useState } from "react";

export default function OrderPanel({ coin, livePrice }) {
  const [tab, setTab] = useState("market"); // market | limit | stop
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");

  function handleSubmit(side) {
    let order = {
      side,
      coin: coin.id,
      type: tab,
      amount: parseFloat(amount),
    };

    if (tab === "market") order.price = livePrice;
    if (tab === "limit") order.price = parseFloat(limitPrice);
    if (tab === "stop") {
      order.stopPrice = parseFloat(stopPrice);
      order.limitPrice = parseFloat(limitPrice);
    }

    alert(
      `ORDER PLACED\n\n` +
        `Type: ${tab}\n` +
        `Side: ${side}\n` +
        `Amount: ${amount} ${coin.symbol.toUpperCase()}\n` +
        (tab === "market"
          ? `Market Price: $${livePrice}`
          : tab === "limit"
          ? `Limit Price: $${limitPrice}`
          : `Stop: $${stopPrice}\nLimit: $${limitPrice}`)
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ---------- TABS ---------- */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 8,
        }}
      >
        {["market", "limit", "stop"].map((x) => (
          <button
            key={x}
            onClick={() => setTab(x)}
            className={tab === x ? "tab-active" : "tab"}
            style={{ flex: 1, textAlign: "center" }}
          >
            {x === "market" ? "Market" : x === "limit" ? "Limit" : "Stop-Limit"}
          </button>
        ))}
      </div>

      {/* ---------- AMOUNT ---------- */}
      <div className="field">
        <label>Amount ({coin.symbol.toUpperCase()})</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* ---------- MARKET ---------- */}
      {tab === "market" && (
        <div className="field">
          <label>Market Price</label>
          <input value={livePrice ? `$${livePrice}` : "..."} disabled />
        </div>
      )}

      {/* ---------- LIMIT ---------- */}
      {tab === "limit" && (
        <div className="field">
          <label>Limit Price (USD)</label>
          <input
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder="Enter limit price"
          />
        </div>
      )}

      {/* ---------- STOP LIMIT ---------- */}
      {tab === "stop" && (
        <>
          <div className="field">
            <label>Stop Price (USD)</label>
            <input
              type="number"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder="Enter stop price"
            />
          </div>

          <div className="field">
            <label>Limit Price (USD)</label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="Enter limit price"
            />
          </div>
        </>
      )}

      {/* ---------- BUY / SELL BUTTONS ---------- */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 12,
        }}
      >
        <button
          className="trade-btn buy"
          onClick={() => handleSubmit("buy")}
          style={{ flex: 1 }}
        >
          Buy
        </button>

        <button
          className="trade-btn sell"
          onClick={() => handleSubmit("sell")}
          style={{ flex: 1 }}
        >
          Sell
        </button>
      </div>
    </div>
  );
}

// src/components/OrderPanel.jsx
import React, { useEffect, useState } from "react";

/**
 * OrderPanel
 * - Demo balance + holdings persisted in localStorage
 * - Market order execution at provided livePrice (prop)
 * - Buy / Sell forms, SL/TP simple inputs (saved)
 */
export default function OrderPanel({ coin = { id: "bitcoin", symbol: "btc", name: "Bitcoin" }, livePrice = null }) {
  const keyBal = "demo_balance_v2";
  const keyHold = `demo_hold_${coin.id}`;
  const keyTrades = "demo_trades_v2";

  const [balance, setBalance] = useState(() => Number(localStorage.getItem(keyBal) || 10000));
  const [holdings, setHoldings] = useState(() => Number(localStorage.getItem(keyHold) || 0));
  const [usdAmount, setUsdAmount] = useState("");
  const [side, setSide] = useState("buy");
  const [trades, setTrades] = useState(() => JSON.parse(localStorage.getItem(keyTrades) || "[]"));

  useEffect(() => localStorage.setItem(keyBal, String(balance)), [balance]);
  useEffect(() => localStorage.setItem(keyHold, String(holdings)), [holdings]);
  useEffect(() => localStorage.setItem(keyTrades, JSON.stringify(trades)), [trades]);

  // update keys if coin changes (simple reset for holdings key)
  useEffect(() => {
    const b = Number(localStorage.getItem(keyBal) || 10000);
    const h = Number(localStorage.getItem(`demo_hold_${coin.id}`) || 0);
    setBalance(b);
    setHoldings(h);
    setTrades(JSON.parse(localStorage.getItem(keyTrades) || "[]"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coin.id]);

  function uid() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  function executeMarket() {
    const amt = Number(usdAmount);
    if (!amt || amt <= 0) { alert("Enter USD amount"); return; }
    if (!livePrice || livePrice <= 0) { alert("Live price not available"); return; }

    const qty = amt / livePrice;
    if (side === "buy") {
      if (amt > balance) { alert("Insufficient balance"); return; }
      setBalance((b) => +(b - amt).toFixed(6));
      setHoldings((h) => +(h + qty).toFixed(8));
    } else {
      if (qty > holdings) { alert("Not enough holdings"); return; }
      setHoldings((h) => +(h - qty).toFixed(8));
      setBalance((b) => +(b + amt).toFixed(6));
    }

    const t = { id: uid(), time: new Date().toISOString(), coin: coin.id, side: side.toUpperCase(), usd: amt, qty, price: livePrice };
    setTrades((s) => [t, ...s].slice(0, 200));
    setUsdAmount("");
  }

  function resetDemo() {
    if (!window.confirm("Reset demo balance and holdings?")) return;
    setBalance(10000);
    setHoldings(0);
    setTrades([]);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 900, color: "var(--accent)" }}>{coin.name}</div>
          <div className="sub">{coin.symbol?.toUpperCase()} / USD</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="small">Live</div>
          <div style={{ fontWeight: 900, color: "var(--accent)", fontSize: 18 }}>{livePrice ? `$${Number(livePrice).toLocaleString()}` : "—"}</div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <button className="btn" onClick={() => setSide("buy")} style={{ background: side === "buy" ? "var(--positive)" : "#222", color: side === "buy" ? "#000" : "#fff" }}>Buy</button>
        <button className="btn" onClick={() => setSide("sell")} style={{ background: side === "sell" ? "var(--negative)" : "#222", color: "#fff" }}>Sell</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <input value={usdAmount} onChange={(e) => setUsdAmount(e.target.value)} className="input" placeholder="Amount in USD" />
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <button className="btn" onClick={executeMarket} style={{ background: "var(--accent)", color: "#000" }}>{side === "buy" ? "Buy Market" : "Sell Market"}</button>
        <button className="btn" onClick={resetDemo}>Reset</button>
      </div>

      <div style={{ marginTop: 12 }} className="card small">
        <div>Balance: <strong style={{ color: "var(--accent)" }}>${balance.toFixed(2)}</strong></div>
        <div>Holdings: <strong>{holdings.toFixed(8)} {coin.symbol?.toUpperCase()}</strong></div>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4 style={{ margin: 0, color: "var(--accent)" }}>Recent Trades</h4>
        <div style={{ maxHeight: 160, overflow: "auto", marginTop: 8 }}>
          {trades.length === 0 && <div className="small">No trades yet</div>}
          {trades.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div className="small">{new Date(t.time).toLocaleString()} • <strong style={{ color: t.side === "BUY" ? "var(--positive)" : "var(--negative)" }}>{t.side}</strong></div>
              <div className="small">${t.usd.toFixed(2)} @ {Number(t.price).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

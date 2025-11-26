// src/components/TradeForm.jsx
import React, { useEffect, useState, useRef } from "react";

function uid() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export default function TradeForm({ coin = { id: "bitcoin", symbol: "btc", name: "Bitcoin" }, livePrice }) {
  const keyBalance = "demo_balance_v4";
  const keyOrders = "demo_orders_v4";

  const [balance, setBalance] = useState(() => Number(localStorage.getItem(keyBalance) || 10000));
  const [holdings, setHoldings] = useState(() => Number(localStorage.getItem(`demo_hold_${coin.id}`) || 0));
  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(keyOrders) || "[]");
    } catch {
      return [];
    }
  });

  // form
  const [side, setSide] = useState("buy");
  const [type, setType] = useState("market");
  const [amountUsd, setAmountUsd] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [quickPct, setQuickPct] = useState(null);
  const amountRef = useRef(null);

  useEffect(() => localStorage.setItem(keyBalance, String(balance)), [balance]);
  useEffect(() => localStorage.setItem(`demo_hold_${coin.id}`, String(holdings)), [holdings]);
  useEffect(() => localStorage.setItem(keyOrders, JSON.stringify(orders)), [orders]);

  // keyboard submit: Enter on amount triggers placeOrder
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Enter") placeOrder();
    }
    const el = amountRef.current;
    if (el) el.addEventListener("keydown", onKey);
    return () => el && el.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountUsd, type, limitPrice, stopPrice, side, livePrice]);

  // quick amount calculation
  useEffect(() => {
    if (quickPct && balance) {
      const pct = Number(quickPct);
      const val = Math.max(0, (balance * pct) / 100);
      setAmountUsd(val.toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickPct]);

  function placeOrder() {
    const amt = Number(amountUsd);
    if (!amt || amt <= 0) { alert("Enter USD amount"); return; }

    if (type === "market") {
      if (!livePrice) { alert("Live price not available"); return; }
      return executeImmediate(side, amt, livePrice, false);
    }
    if (type === "limit") {
      const p = Number(limitPrice); if (!p || p <= 0) { alert("Enter limit price"); return; }
      const o = { id: uid(), type: "limit", side, amountUsd: amt, price: p, time: new Date().toISOString() };
      setOrders((prev) => [o, ...prev]); setAmountUsd(""); setLimitPrice(""); setQuickPct(null); return;
    }
    if (type === "stop") {
      const s = Number(stopPrice); if (!s || s <= 0) { alert("Enter stop price"); return; }
      const o = { id: uid(), type: "stop", side, amountUsd: amt, stop: s, time: new Date().toISOString() };
      setOrders((prev) => [o, ...prev]); setAmountUsd(""); setStopPrice(""); setQuickPct(null); return;
    }
  }

  function executeImmediate(sideLocal, amountUsdLocal, priceExecuted, auto = false) {
    const qty = amountUsdLocal / priceExecuted;
    if (sideLocal === "buy") {
      if (amountUsdLocal > balance + 1e-9) { alert("Insufficient balance"); return false; }
      setBalance((b) => +(b - amountUsdLocal).toFixed(8));
      setHoldings((h) => +(h + qty).toFixed(8));
    } else {
      if (qty > holdings + 1e-9) { alert("Not enough holdings"); return false; }
      setHoldings((h) => +(h - qty).toFixed(8));
      setBalance((b) => +(b + amountUsdLocal).toFixed(8));
    }
    const t = { id: uid(), time: new Date().toISOString(), side: sideLocal.toUpperCase(), usd: amountUsdLocal, qty, price: priceExecuted, auto };
    const histKey = "demo_trades_v4";
    try {
      const raw = localStorage.getItem(histKey) || "[]";
      const arr = JSON.parse(raw);
      arr.unshift(t);
      localStorage.setItem(histKey, JSON.stringify(arr.slice(0, 500)));
    } catch {}
    setAmountUsd(""); setQuickPct(null);
    return true;
  }

  function cancelOrder(id) { setOrders((p) => p.filter((o) => o.id !== id)); }

  function resetDemo() {
    if (!window.confirm("Reset demo?")) return;
    setBalance(10000); setHoldings(0); setOrders([]); localStorage.removeItem("demo_trades_v4");
  }

  // If livePrice updates, try to auto-match limit/stop orders
  useEffect(() => {
    if (!livePrice) return;
    const remaining = [];
    orders.forEach((o) => {
      let matched = false;
      if (o.type === "limit") {
        if (o.side === "buy" && livePrice <= o.price) matched = true;
        if (o.side === "sell" && livePrice >= o.price) matched = true;
      }
      if (o.type === "stop") {
        if (o.side === "sell" && livePrice <= o.stop) matched = true;
        if (o.type === "buy" && livePrice >= o.stop) matched = true;
      }
      if (matched) executeImmediate(o.side, o.amountUsd, livePrice, true);
      else remaining.push(o);
    });
    if (remaining.length !== orders.length) setOrders(remaining);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePrice]);

  const trades = (() => { try { return JSON.parse(localStorage.getItem("demo_trades_v4") || "[]"); } catch { return []; } })();

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setSide("buy")} style={{ background: side === "buy" ? "var(--positive)" : "#222", color: side === "buy" ? "#000" : "#fff" }}>Buy</button>
          <button className="btn" onClick={() => setSide("sell")} style={{ background: side === "sell" ? "var(--negative)" : "#222", color: "#fff" }}>Sell</button>
        </div>

        <div style={{ textAlign: "right" }}>
          <div className="small">Balance</div>
          <div style={{ fontWeight: 800, color: "var(--accent)" }}>${balance.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn" onClick={() => setType("market")} style={{ background: type === "market" ? "#122433" : "#071426" }}>Market</button>
          <button className="btn" onClick={() => setType("limit")} style={{ background: type === "limit" ? "#122433" : "#071426" }}>Limit</button>
          <button className="btn" onClick={() => setType("stop")} style={{ background: type === "stop" ? "#122433" : "#071426" }}>Stop</button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setQuickPct(25)}>25%</button>
          <button className="btn" onClick={() => setQuickPct(50)}>50%</button>
          <button className="btn" onClick={() => setQuickPct(75)}>75%</button>
          <button className="btn" onClick={() => setQuickPct(100)}>100%</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <input ref={amountRef} className="input" placeholder="Amount (USD)" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} />
        </div>

        {type === "limit" && <div style={{ width: 140 }}><input className="input" placeholder="Limit price" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} /></div>}
        {type === "stop" && <div style={{ width: 140 }}><input className="input" placeholder="Stop price" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} /></div>}

        <div>
          <button className="btn" onClick={placeOrder} style={{ background: side === "buy" ? "var(--positive)" : "var(--negative)", color: side === "buy" ? "#000" : "#fff", minWidth: 120 }}>
            {side === "buy" ? "Buy" : "Sell"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <input className="input" placeholder="Stop loss (price)" value={""} readOnly style={{ opacity: 0.6 }} />
        <input className="input" placeholder="Take profit (price)" value={""} readOnly style={{ opacity: 0.6 }} />
        <button className="btn" onClick={resetDemo}>Reset Demo</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4 style={{ margin: 0, color: "var(--accent)" }}>Open Orders</h4>
        <div style={{ maxHeight: 140, overflow: "auto", marginTop: 8 }}>
          {orders.length === 0 && <div className="small">No open orders</div>}
          {orders.map((o) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div className="small">{o.type.toUpperCase()} • {o.side.toUpperCase()} • ${o.amountUsd} {o.price ? `@ ${o.price}` : o.stop ? `(stop ${o.stop})` : ""}</div>
              <div><button className="btn" onClick={() => cancelOrder(o.id)}>Cancel</button></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4 style={{ margin: 0, color: "var(--accent)" }}>Recent Trades</h4>
        <div style={{ maxHeight: 140, overflow: "auto", marginTop: 8 }}>
          {trades.length === 0 && <div className="small">No trades yet</div>}
          {trades.slice(0, 50).map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div className="small">{new Date(t.time).toLocaleString()} • <strong style={{ color: t.side === "BUY" ? "var(--positive)" : "var(--negative)" }}>{t.side}</strong></div>
              <div className="small">${t.usd.toFixed(2)} @ {Number(t.price).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }} className="card small">
        <div>Balance: <strong style={{ color: "var(--accent)" }}>${balance.toFixed(2)}</strong></div>
        <div>Holdings: <strong>{holdings.toFixed(8)} {coin.symbol?.toUpperCase()}</strong></div>
      </div>
    </div>
  );
}

// src/pages/LandingPage.jsx — WayMore: Light. Spatial. Intelligent. Alive.
import React, {
  useEffect, useState, useRef, useCallback
} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getCryptoPrices } from "../services/priceService";
import {
  Zap, ShieldCheck, BarChart3, Headphones, ArrowRight,
  Globe, Users, CheckCircle2, Lock, Menu, X, TrendingUp
} from "lucide-react";
import "./LandingPage.css";

/* ─── Motion tokens (matches CSS vars) ─────────────────────────── */

/* ─── Coin data config ──────────────────────────────────────────── */
const COINS = {
  BTC: {
    symbol: "BTC", name: "Bitcoin", pair: "BTC / USDT",
    color: "#F7931A", defaultPrice: 63842.10, defaultChange: "+2.35",
    chartSeed: [130, 110, 90, 105, 55, 40, 60, 25, 18],
  },
  ETH: {
    symbol: "ETH", name: "Ethereum", pair: "ETH / USDT",
    color: "#627EEA", defaultPrice: 3142.88, defaultChange: "+1.12",
    chartSeed: [140, 120, 100, 115, 80, 60, 70, 45, 35],
  },
  SOL: {
    symbol: "SOL", name: "Solana", pair: "SOL / USDT",
    color: "#9945FF", defaultPrice: 142.56, defaultChange: "-0.45",
    chartSeed: [150, 130, 145, 120, 100, 85, 90, 65, 50],
  },
};

/* ─── Chart path helper ─────────────────────────────────────────── */
function buildCandleData(seed) {
  const candles = [];
  const xs = [20, 50, 80, 110, 140, 170, 200, 230, 260, 285];
  let prev = seed[0];
  xs.forEach((x, i) => {
    const base = seed[i] ?? prev + (Math.random() - 0.5) * 20;
    const open = base;
    const close = base + (Math.random() - 0.48) * 18;
    const high = Math.min(open, close) - Math.random() * 8;
    const low  = Math.max(open, close) + Math.random() * 8;
    candles.push({ x, open, close, high, low, bull: close < open });
    prev = close;
  });
  return candles;
}

function buildLinePath(candles) {
  return candles
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${(c.open + c.close) / 2}`)
    .join(" ");
}

/* ─── ORDER BOOK SIMULATION ─────────────────────────────────────── */
function generateOrderBook(basePrice) {
  const asks = [];
  const bids = [];
  for (let i = 0; i < 5; i++) {
    asks.push({
      price: (basePrice + i * 0.5 + Math.random() * 0.3).toFixed(2),
      amount: (Math.random() * 0.3 + 0.05).toFixed(4),
      id: `ask-${i}`,
    });
    bids.push({
      price: (basePrice - i * 0.5 - Math.random() * 0.3).toFixed(2),
      amount: (Math.random() * 0.3 + 0.05).toFixed(4),
      id: `bid-${i}`,
    });
  }
  return { asks, bids };
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════ */

/* ── Network Globe SVG ──────────────────────────────────────────── */
function NetworkGlobe() {
  return (
    <div className="globe-container" aria-hidden="true">
      <svg viewBox="0 0 260 260" className="globe-svg">
        {/* Outer circle */}
        <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(0,194,199,0.12)" strokeWidth="1" />
        <circle cx="130" cy="130" r="80"  fill="none" stroke="rgba(0,194,199,0.08)" strokeWidth="1" />
        <circle cx="130" cy="130" r="40"  fill="none" stroke="rgba(0,194,199,0.06)" strokeWidth="1" />
        {/* Meridians */}
        <ellipse cx="130" cy="130" rx="60" ry="120" fill="none" stroke="rgba(0,194,199,0.08)" strokeWidth="1" />
        <ellipse cx="130" cy="130" rx="100" ry="120" fill="none" stroke="rgba(0,194,199,0.06)" strokeWidth="1" />
        <ellipse cx="130" cy="130" rx="120" ry="60" fill="none" stroke="rgba(0,194,199,0.08)" strokeWidth="1" />
        {/* Node dots */}
        {[
          [130, 10], [250, 130], [130, 250], [10, 130],
          [185, 55], [185, 205], [75, 55], [75, 205],
          [50, 130], [210, 130], [130, 50], [130, 210],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3"
            fill="rgba(0,194,199,0.5)"
            className={`globe-node globe-node-${i % 4}`}
          />
        ))}
        {/* Connection lines */}
        <line x1="130" y1="10"  x2="250" y2="130" stroke="rgba(0,194,199,0.1)" strokeWidth="0.8" />
        <line x1="250" y1="130" x2="130" y2="250" stroke="rgba(0,194,199,0.1)" strokeWidth="0.8" />
        <line x1="130" y1="250" x2="10"  y2="130" stroke="rgba(0,194,199,0.1)" strokeWidth="0.8" />
        <line x1="10"  y1="130" x2="130" y2="10"  stroke="rgba(0,194,199,0.1)" strokeWidth="0.8" />
        <line x1="185" y1="55"  x2="185" y2="205" stroke="rgba(0,194,199,0.08)" strokeWidth="0.8" />
        <line x1="75"  y1="55"  x2="75"  y2="205" stroke="rgba(0,194,199,0.08)" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

/* ── Hero Background ────────────────────────────────────────────── */
function HeroBackground({ mousePos }) {
  return (
    <div className="hero-bg" aria-hidden="true">
      <div className="hero-orb hero-orb-cyan"
        style={{ transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)` }} />
      <div className="hero-orb hero-orb-blue"
        style={{ transform: `translate(${-mousePos.x * 1.5}px, ${mousePos.y * 1.5}px)` }} />
      <div className="hero-orb hero-orb-violet"
        style={{ transform: `translate(${mousePos.x * 1}px, ${-mousePos.y * 1}px)` }} />
      <div className="hero-grid-overlay" />
      <div className="hero-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`hero-particle p-${i}`} />
        ))}
      </div>
      <div style={{ transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)`, transition: "transform 0.6s ease-out" }}>
        <NetworkGlobe />
      </div>
    </div>
  );
}

/* ── Animated Chart (SVG candlesticks + line) ───────────────────── */
function AnimatedChart({ coin, prices }) {
  const [candles, setCandles] = useState(() => buildCandleData(COINS[coin].chartSeed));
  const [drawn, setDrawn] = useState(false);
  const pathRef = useRef(null);
  const pathLen = useRef(0);

  // Rebuild candles when coin changes
  useEffect(() => {
    setDrawn(false);
    setCandles(buildCandleData(COINS[coin].chartSeed));
  }, [coin]);

  // Animate path draw
  useEffect(() => {
    if (!pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    pathLen.current = len;
    pathRef.current.style.strokeDasharray = len;
    pathRef.current.style.strokeDashoffset = len;
    const t = setTimeout(() => {
      if (pathRef.current) {
        pathRef.current.style.transition = "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)";
        pathRef.current.style.strokeDashoffset = "0";
        setDrawn(true);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [candles]);

  // Push new candle every 4s
  useEffect(() => {
    if (!drawn) return;
    const interval = setInterval(() => {
      setCandles(prev => {
        const last = prev[prev.length - 1];
        const newCandle = {
          x: last.x,
          open: last.close,
          close: last.close + (Math.random() - 0.48) * 12,
          high: 0, low: 0, bull: false,
        };
        newCandle.bull = newCandle.close < newCandle.open;
        newCandle.high = Math.min(newCandle.open, newCandle.close) - Math.random() * 5;
        newCandle.low  = Math.max(newCandle.open, newCandle.close) + Math.random() * 5;
        const shifted = prev.slice(1).map((c, i) => ({ ...c, x: [20,50,80,110,140,170,200,230,260,285][i] }));
        return [...shifted, { ...newCandle, x: 285 }];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [drawn]);

  const linePath = buildLinePath(candles);

  return (
    <svg className="chart-svg" viewBox="0 0 310 180" preserveAspectRatio="none">
      {/* Grid lines */}
      {[35, 80, 125, 170].map(y => (
        <line key={y} x1="0" y1={y} x2="310" y2={y}
          stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 4" />
      ))}
      {/* Candles */}
      {candles.map((c, i) => (
        <g key={i} className={`chart-candle candle-reveal candle-delay-${i}`}>
          <line x1={c.x} y1={c.high} x2={c.x} y2={c.low}
            stroke={c.bull ? "#00B67A" : "#F04452"} strokeWidth="1.5" />
          <rect
            x={c.x - 6} y={Math.min(c.open, c.close)}
            width="12" height={Math.max(Math.abs(c.close - c.open), 2)}
            fill={c.bull ? "#00B67A" : "#F04452"} rx="1.5"
          />
        </g>
      ))}
      {/* Trend line */}
      <path ref={pathRef} d={linePath}
        fill="none" stroke="#00C2C7" strokeWidth="2" strokeLinecap="round"
        style={{ strokeDasharray: 0, strokeDashoffset: 0 }}
      />
      {/* Area fill */}
      <path d={`${linePath} L 285 180 L 20 180 Z`}
        fill="url(#chartGrad)" opacity={drawn ? 1 : 0}
        style={{ transition: "opacity 600ms ease 900ms" }}
      />
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00C2C7" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#00C2C7" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Live Price Display ──────────────────────────────────────────── */
function LivePrice({ coin, prices }) {
  const [displayPrice, setDisplayPrice] = useState(prices[coin] ?? COINS[coin].defaultPrice);
  const [flash, setFlash] = useState(null); // 'up' | 'down' | null
  const prevPrice = useRef(displayPrice);

  useEffect(() => {
    const newPrice = prices[coin] ?? COINS[coin].defaultPrice;
    if (newPrice !== prevPrice.current) {
      const dir = newPrice > prevPrice.current ? "up" : "down";
      setDisplayPrice(newPrice);
      setFlash(dir);
      prevPrice.current = newPrice;
      const t = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(t);
    }
  }, [prices, coin]);

  // Small simulated drift when real price hasn't changed
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayPrice(prev => {
        const drift = prev * (1 + (Math.random() - 0.499) * 0.0005);
        const dir = drift > prev ? "up" : "down";
        setFlash(dir);
        setTimeout(() => setFlash(null), 350);
        prevPrice.current = drift;
        return drift;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const fmt = (p) => coin === "XRP"
    ? p.toFixed(4)
    : p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <span className={`live-price-num${flash ? ` price-flash-${flash}` : ""}`}>
      ${fmt(displayPrice)}
    </span>
  );
}

/* ── Live Order Book ────────────────────────────────────────────── */
function LiveOrderBook({ coin, prices }) {
  const basePrice = prices[coin] ?? COINS[coin].defaultPrice;
  const [book, setBook] = useState(() => generateOrderBook(basePrice));
  const [flashRow, setFlashRow] = useState(null);

  // Regenerate when coin changes
  useEffect(() => {
    setBook(generateOrderBook(prices[coin] ?? COINS[coin].defaultPrice));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coin]);

  // Mutate a random row every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      const side = Math.random() > 0.5 ? "asks" : "bids";
      const idx  = Math.floor(Math.random() * 5);
      setBook(prev => {
        const updated = { ...prev };
        updated[side] = [...prev[side]];
        const row = { ...updated[side][idx] };
        row.amount = (parseFloat(row.amount) + (Math.random() - 0.45) * 0.08).toFixed(4);
        if (parseFloat(row.amount) < 0.01) row.amount = (0.01 + Math.random() * 0.05).toFixed(4);
        updated[side][idx] = row;
        return updated;
      });
      setFlashRow(`${side}-${idx}`);
      setTimeout(() => setFlashRow(null), 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="order-book-panel">
      <div className="ob-header">
        <span>Price (USDT)</span>
        <span>Amount</span>
      </div>
      {book.asks.slice(0, 4).map((row, i) => (
        <div key={row.id}
          className={`ob-row ob-ask${flashRow === `asks-${i}` ? " ob-flash" : ""}`}>
          <span className="ob-price-ask">{row.price}</span>
          <span className="ob-amount">{row.amount}</span>
          <div className="ob-depth-bar ob-depth-ask"
            style={{ width: `${Math.min(parseFloat(row.amount) * 300, 90)}%` }} />
        </div>
      ))}
      <div className="ob-spread">
        <span className="ob-mid-price">{basePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        <span className="ob-spread-label">spread</span>
      </div>
      {book.bids.slice(0, 4).map((row, i) => (
        <div key={row.id}
          className={`ob-row ob-bid${flashRow === `bids-${i}` ? " ob-flash" : ""}`}>
          <span className="ob-price-bid">{row.price}</span>
          <span className="ob-amount">{row.amount}</span>
          <div className="ob-depth-bar ob-depth-bid"
            style={{ width: `${Math.min(parseFloat(row.amount) * 300, 90)}%` }} />
        </div>
      ))}
    </div>
  );
}

/* ── Buy/Sell Order Panel ───────────────────────────────────────── */
function OrderPanel({ activeSide, onSideChange }) {
  const [orderType, setOrderType] = useState("Market");
  const [pct, setPct] = useState(25);

  const isBuy = activeSide === "Buy";
  const accentColor = isBuy ? "#00B67A" : "#F04452";
  const accentBg    = isBuy ? "rgba(0,182,122,0.1)" : "rgba(240,68,82,0.1)";

  return (
    <div className="order-panel-live">
      {/* Buy / Sell tabs */}
      <div className="bs-tab-row">
        {["Buy", "Sell"].map(s => (
          <button key={s}
            className={`bs-tab${activeSide === s ? " bs-tab-active" : ""}`}
            style={activeSide === s ? { color: accentColor, borderColor: accentColor } : {}}
            onClick={() => onSideChange(s)}
          >{s}</button>
        ))}
      </div>

      {/* Order type */}
      <div className="ot-row">
        {["Market", "Limit", "Stop"].map(t => (
          <button key={t}
            className={`ot-btn${orderType === t ? " ot-active" : ""}`}
            onClick={() => setOrderType(t)}
          >{t}</button>
        ))}
      </div>

      {/* Price input (visible for limit/stop) */}
      {orderType !== "Market" && (
        <div className="op-input-group">
          <span className="op-input-label">Price (USDT)</span>
          <div className="op-input-row">
            <input className="op-input" type="text" placeholder="0.00" readOnly />
          </div>
        </div>
      )}

      {/* Amount input */}
      <div className="op-input-group">
        <span className="op-input-label">Amount</span>
        <div className="op-input-row">
          <input className="op-input" type="text" placeholder="0.0000" readOnly />
          <span className="op-input-suffix">BTC</span>
        </div>
      </div>

      {/* Percent slider */}
      <div className="pct-row">
        {[25, 50, 75, 100].map(p => (
          <button key={p}
            className={`pct-btn${pct === p ? " pct-active" : ""}`}
            style={pct === p ? { background: accentBg, color: accentColor, borderColor: accentColor } : {}}
            onClick={() => setPct(p)}
          >{p}%</button>
        ))}
      </div>

      {/* Execute button */}
      <button className="exec-btn" style={{ background: accentColor }}>
        {isBuy ? "Buy" : "Sell"} BTC
      </button>
    </div>
  );
}

/* ── Trading Terminal Preview ───────────────────────────────────── */
function TradingTerminalPreview({ prices, mousePos }) {
  const [coin, setCoin]       = useState("BTC");
  const [activeSide, setSide] = useState("Buy");
  const [entered, setEntered] = useState(false);
  const lastInteraction       = useRef(Date.now());
  const autoCycleRef          = useRef(null);
  const coinList              = ["BTC", "ETH", "SOL"];

  // Track user interactions to pause auto-cycle
  const handleCoinClick = (c) => {
    setCoin(c);
    lastInteraction.current = Date.now();
  };
  const handleSideChange = (s) => {
    setSide(s);
    lastInteraction.current = Date.now();
  };

  // Entrance trigger
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Auto-cycle coins if idle > 6s
  useEffect(() => {
    autoCycleRef.current = setInterval(() => {
      if (Date.now() - lastInteraction.current > 6000) {
        setCoin(prev => {
          const idx = coinList.indexOf(prev);
          return coinList[(idx + 1) % coinList.length];
        });
      }
    }, 6000);
    return () => clearInterval(autoCycleRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const coinData  = COINS[coin];
  const pxShift   = `translate(${mousePos.x * 3}px, ${mousePos.y * 3}px)`;
  const changePos = coinData.defaultChange.startsWith("+");

  return (
    <div className={`terminal-wrapper${entered ? " terminal-entered" : ""}`}
      style={{ transform: pxShift, transition: "transform 0.5s ease-out" }}>

      {/* Browser chrome */}
      <div className="term-browser-chrome">
        <div className="browser-dots">
          <span className="bdot bdot-r" />
          <span className="bdot bdot-y" />
          <span className="bdot bdot-g" />
        </div>
        <span className="term-url-bar">waymore.com/trade/{coin.toLowerCase()}-usdt</span>
        <span className="term-live-badge">
          <span className="live-pulse-dot" />LIVE
        </span>
      </div>

      {/* Coin selector tabs */}
      <div className="coin-tab-row">
        {coinList.map(c => (
          <button key={c}
            className={`coin-tab${coin === c ? " coin-tab-active" : ""}`}
            onClick={() => handleCoinClick(c)}>
            <span className="coin-dot" style={{ background: COINS[c].color }} />
            {c}
          </button>
        ))}
        <span className="timeframe-tabs">
          <button className="tf-btn tf-active">1H</button>
          <button className="tf-btn">4H</button>
          <button className="tf-btn">1D</button>
        </span>
      </div>

      {/* Header: pair + price */}
      <div className="term-header">
        <div className="term-pair-info">
          <span className="term-coin-dot" style={{ background: coinData.color }} />
          <span className="term-pair-name">{coinData.pair}</span>
          <span className={`term-change ${changePos ? "pos" : "neg"}`}>
            {coinData.defaultChange}%
          </span>
        </div>
        <LivePrice coin={coin} prices={prices} />
      </div>

      {/* Main content grid */}
      <div className="term-body">
        {/* Chart column */}
        <div className="term-chart-col">
          <AnimatedChart coin={coin} prices={prices} />
        </div>
        {/* Right panel */}
        <div className="term-right-col">
          <LiveOrderBook coin={coin} prices={prices} />
          <OrderPanel activeSide={activeSide} onSideChange={handleSideChange} />
        </div>
      </div>
    </div>
  );
}

/* ── Mobile Portfolio Preview ───────────────────────────────────── */
function MobilePortfolioPreview({ prices, mousePos }) {
  const [graphDrawn, setGraphDrawn] = useState(false);
  const [entered, setEntered]       = useState(false);
  const mobPathRef                  = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mobPathRef.current) return;
    const len = mobPathRef.current.getTotalLength();
    mobPathRef.current.style.strokeDasharray = len;
    mobPathRef.current.style.strokeDashoffset = len;
    const t = setTimeout(() => {
      if (mobPathRef.current) {
        mobPathRef.current.style.transition = "stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1)";
        mobPathRef.current.style.strokeDashoffset = "0";
        setGraphDrawn(true);
      }
    }, 700);
    return () => clearTimeout(t);
  }, []);

  const pxShift = `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)`;

  return (
    <div
      className={`mobile-preview-wrapper${entered ? " mobile-entered" : ""}`}
      style={{ transform: pxShift, transition: "transform 0.4s ease-out" }}
    >
      <div className="phone-frame">
        {/* Notch */}
        <div className="phone-notch" />
        <div className="phone-inner">
          {/* Status row */}
          <div className="phone-status-row">
            <span className="phone-time">9:41</span>
            <Zap size={10} color="#00C2C7" />
          </div>

          {/* Portfolio header */}
          <div className="phone-section-label">Total Portfolio</div>
          <div className="phone-balance-row">
            <span className="phone-balance">$24,568.00</span>
            <span className="phone-pct">+12.35%</span>
          </div>

          {/* Mini graph */}
          <svg viewBox="0 0 180 60" className="phone-graph-svg">
            <defs>
              <linearGradient id="phoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C2C7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00C2C7" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 0 45 C 30 38, 50 20, 80 28 S 130 10, 180 8 L 180 60 L 0 60 Z"
              fill="url(#phoneGrad)"
              opacity={graphDrawn ? 1 : 0}
              style={{ transition: "opacity 500ms ease 800ms" }}
            />
            <path
              ref={mobPathRef}
              d="M 0 45 C 30 38, 50 20, 80 28 S 130 10, 180 8"
              fill="none" stroke="#00C2C7" strokeWidth="2" strokeLinecap="round"
            />
          </svg>

          {/* Watchlist */}
          <div className="phone-wl-title">Watchlist</div>
          {[
            { sym: "BTC", name: "Bitcoin",  price: prices.BTC, pct: "+2.35", up: true  },
            { sym: "ETH", name: "Ethereum", price: prices.ETH, pct: "+1.12", up: true  },
            { sym: "SOL", name: "Solana",   price: prices.SOL, pct: "-0.45", up: false },
          ].map(coin => (
            <div key={coin.sym} className="phone-wl-row">
              <div>
                <div className="phone-wl-sym">{coin.sym}</div>
                <div className="phone-wl-name">{coin.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="phone-wl-price">
                  ${coin.price
                    ? coin.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : "—"}
                </div>
                <div className={`phone-wl-pct ${coin.up ? "pos" : "neg"}`}>{coin.pct}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Animated Metric Counter ────────────────────────────────────── */
function MetricCounter({ target, suffix = "", duration = 800 }) {
  const [count, setCount]     = useState(0);
  const [started, setStarted] = useState(false);
  const ref                   = useRef(null);

  useEffect(() => {
    if (started) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const step = duration / steps;
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (frame >= steps) {
        setCount(target);
        clearInterval(timer);
      }
    }, step);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Scroll Reveal Wrapper ──────────────────────────────────────── */
function ScrollReveal({ children, delay = 0, className = "" }) {
  const ref        = useRef(null);
  const [vis, setV] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setV(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`scroll-reveal${vis ? " scroll-reveal-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Shield Security SVG ───────────────────────────────────────── */
function SecurityShield() {
  const [drawn, setDrawn] = useState(false);
  const ref               = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setDrawn(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="security-shield-wrap" aria-hidden="true">
      <svg viewBox="0 0 120 140" className="shield-svg">
        <path
          d="M 60 8 L 108 30 L 108 72 C 108 100 86 122 60 132 C 34 122 12 100 12 72 L 12 30 Z"
          fill="none" stroke="#00C2C7" strokeWidth="2.5"
          className={`shield-path${drawn ? " shield-drawn" : ""}`}
        />
        <path
          d="M 40 70 L 54 84 L 82 56"
          fill="none" stroke="#00C2C7" strokeWidth="3" strokeLinecap="round"
          className={`shield-check${drawn ? " shield-check-drawn" : ""}`}
        />
      </svg>
      {/* Node ring */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const cx  = 60 + Math.cos(rad) * 52;
        const cy  = 70 + Math.sin(rad) * 52;
        return (
          <div key={i} className={`shield-node node-delay-${i}`}
            style={{ left: cx, top: cy, animationDelay: drawn ? `${i * 0.12}s` : "0s",
              opacity: drawn ? 1 : 0, transition: `opacity 0.3s ease ${i * 0.12}s` }} />
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled]             = useState(false);
  const [mousePos, setMousePos]             = useState({ x: 0, y: 0 });
  const [heroVisible, setHeroVisible]       = useState(false);

  const [prices, setPrices] = useState({
    BTC: 63842.10, ETH: 3142.88, SOL: 142.56,
    BNB: 584.32,   XRP: 0.5234,  XAU: 2400.00,
  });

  // Fetch live prices
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const live = await getCryptoPrices();
        if (mounted && live) setPrices(p => ({ ...p, ...live }));
      } catch (e) {
        console.error("Landing prices:", e);
      }
    }
    load();
    const id = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Header scroll transformation
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hero entrance trigger
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Pointer parallax (desktop only)
  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx   = rect.width / 2;
    const cy   = rect.height / 2;
    setMousePos({
      x: (e.clientX - rect.left - cx) / cx * 8,
      y: (e.clientY - rect.top  - cy) / cy * 8,
    });
  }, []);
  const handleMouseLeave = useCallback(() => setMousePos({ x: 0, y: 0 }), []);

  // Ticker changes (small simulated movement)
  const [tickerChanges] = useState({
    BTC: "+2.35", ETH: "+1.12", SOL: "-0.45",
    BNB: "+1.78", XRP: "+0.68", XAU: "+0.85",
  });

  const heroCls = `hero-section${heroVisible ? " hero-visible" : ""}`;

  return (
    <div className="landing-page">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className={`landing-header${scrolled ? " header-scrolled" : ""}`}>
        <div className="landing-container landing-header-inner">

          <Link to="/" className="landing-logo">
            <Zap className="logo-bolt" size={24} fill="currentColor" />
            <span>
              <span className="logo-way">Way</span>
              <span className="logo-more">More</span>
            </span>
          </Link>

          <nav className="landing-nav">
            {["Markets", "Trade", "Futures", "Earn", "Learn", "Company"].map((item, i) => (
              <Link key={item}
                to={item === "Markets" || item === "Futures" ? "/market"
                  : item === "Trade" ? "/trade"
                  : item === "Company" ? "/regulatory-info"
                  : "/news"}
                className="nav-link"
                style={{ animationDelay: `${i * 50}ms` }}
              >{item}</Link>
            ))}
          </nav>

          <div className="landing-auth-actions">
            {user ? (
              <Link to="/home" className="btn-signup">
                Dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-login">Log In</Link>
                <Link to="/signup" className="btn-signup">
                  Sign Up <ArrowRight size={15} />
                </Link>
              </>
            )}
            <button className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle Navigation Menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            {[["Markets", "/market"], ["Trade", "/trade"], ["Earn & Learn", "/news"], ["Company", "/regulatory-info"]].map(([label, path]) => (
              <Link key={label} to={path} className="nav-link"
                onClick={() => setMobileMenuOpen(false)}>{label}</Link>
            ))}
            <div style={{ paddingTop: 10, display: "flex", gap: 10 }}>
              {user ? (
                <Link to="/home" className="btn-signup" style={{ width: "100%", justifyContent: "center" }}>Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-login" style={{ flex: 1, textAlign: "center" }}>Log In</Link>
                  <Link to="/signup" className="btn-signup" style={{ flex: 1, justifyContent: "center" }}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ───────────────────────────────────────── */}
      <section className={heroCls}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}>

        <HeroBackground mousePos={mousePos} />

        <div className="landing-container hero-grid">

          {/* ── LEFT: Content ── */}
          <div className="hero-content">

            {/* Trust badge */}
            <div className="hero-entry hero-entry-1">
              <div className="hero-trust-badge">
                <Users size={13} className="trust-badge-icon" />
                <span>TRUSTED BY 120,000+ TRADERS WORLDWIDE</span>
              </div>
            </div>

            {/* Headline */}
            <div className="hero-entry hero-entry-2">
              <h1 className="hero-headline">
                <span className="headline-line-1">Your Gateway to</span>
                <br />
                <span className="hero-gradient-text headline-line-2">Crypto Trading</span>
              </h1>
            </div>

            {/* Copy */}
            <div className="hero-entry hero-entry-3">
              <p className="hero-subcopy">
                Trade Bitcoin, Ethereum, Gold, and 500+ cryptocurrencies with
                confidence. Professional tools and bank-level security.
              </p>
            </div>

            {/* CTAs */}
            <div className="hero-entry hero-entry-4">
              <div className="hero-cta-group">
                {user ? (
                  <Link to="/home" className="btn-hero-primary btn-shimmer">
                    Go to Dashboard <ArrowRight size={16} className="arrow-icon" />
                  </Link>
                ) : (
                  <>
                    <Link to="/signup" className="btn-hero-primary btn-shimmer">
                      Start Trading Now <ArrowRight size={16} className="arrow-icon" />
                    </Link>
                    <Link to="/login" className="btn-hero-secondary">
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="hero-entry hero-entry-5">
              <div className="hero-metrics-grid">
                {[
                  { icon: <Users size={18} />,      target: 120000, suffix: "+", label: "Active Traders" },
                  { icon: <BarChart3 size={18} />,   target: 500,    suffix: "+", label: "Cryptocurrencies" },
                  { icon: <ShieldCheck size={18} />, target: 99,     suffix: ".9%", label: "Uptime Guarantee" },
                ].map((m, i) => (
                  <div key={i} className="metric-card metric-card-hover">
                    <div className="metric-icon-wrap">{m.icon}</div>
                    <div>
                      <div className="metric-val">
                        <MetricCounter target={m.target} suffix={m.suffix} duration={900} />
                      </div>
                      <div className="metric-lbl">{m.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Product Showcase ── */}
          <div className="hero-visual-col">
            <div className="mockup-pedestal-glow" />

            {/* Desktop Terminal */}
            <TradingTerminalPreview prices={prices} mousePos={mousePos} />

            {/* Mobile Phone (layered in front) */}
            <MobilePortfolioPreview prices={prices} mousePos={mousePos} />
          </div>

        </div>
      </section>

      {/* ── SECTION DIVIDER ─────────────────────────────────────── */}
      <div className="section-divider" />

      {/* ── BENEFITS STRIP ──────────────────────────────────────── */}
      <section className="benefits-section">
        <div className="landing-container">
          <div className="benefits-grid">
            {[
              { icon: <Zap size={22} />,         title: "Lightning Fast",       desc: "Instant execution with ultra-low latency order processing.", delay: 0   },
              { icon: <ShieldCheck size={22} />,  title: "Bank-Level Security",  desc: "Multi-layer encryption & cold storage asset protection.",    delay: 80  },
              { icon: <BarChart3 size={22} />,    title: "Advanced Charts",      desc: "Professional technical indicators and real-time drawing tools.", delay: 160 },
              { icon: <Headphones size={22} />,   title: "24/7 Support",         desc: "Real humans. Real support. Anytime you need us.",            delay: 240 },
            ].map((b, i) => (
              <ScrollReveal key={i} delay={b.delay}>
                <div className="benefit-card">
                  <div className="benefit-icon-box">{b.icon}</div>
                  <div>
                    <div className="benefit-title">{b.title}</div>
                    <div className="benefit-desc">{b.desc}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE MARKET STRIP ───────────────────────────────────── */}
      <ScrollReveal>
        <section className="market-strip-section">
          <div className="landing-container">
            <div className="market-strip-title">
              <div className="live-dot-indicator" />
              <span>LIVE MARKETS OVERVIEW</span>
            </div>
            <div className="market-ticker-track">
              {[
                { sym: "BTC",  pair: "BTC / USDT",   price: prices.BTC,  fmt: p => p.toLocaleString("en-US", { minimumFractionDigits: 2 }), chg: tickerChanges.BTC, pos: true  },
                { sym: "ETH",  pair: "ETH / USDT",   price: prices.ETH,  fmt: p => p.toLocaleString("en-US", { minimumFractionDigits: 2 }), chg: tickerChanges.ETH, pos: true  },
                { sym: "SOL",  pair: "SOL / USDT",   price: prices.SOL,  fmt: p => p.toLocaleString("en-US", { minimumFractionDigits: 2 }), chg: tickerChanges.SOL, pos: false },
                { sym: "BNB",  pair: "BNB / USDT",   price: prices.BNB,  fmt: p => p.toLocaleString("en-US", { minimumFractionDigits: 2 }), chg: tickerChanges.BNB, pos: true  },
                { sym: "XRP",  pair: "XRP / USDT",   price: prices.XRP,  fmt: p => p.toFixed(4),                                            chg: tickerChanges.XRP, pos: true  },
                { sym: "XAU",  pair: "⚜ XAU / USD",  price: prices.XAU,  fmt: p => p.toLocaleString("en-US", { minimumFractionDigits: 2 }), chg: tickerChanges.XAU, pos: true  },
              ].map(coin => (
                <Link key={coin.sym} to="/market" className="ticker-card glass-reflect">
                  <div className="ticker-top">
                    <span className="ticker-sym">{coin.pair}</span>
                    <span className={`ticker-change ${coin.pos ? "pos" : "neg"}`}>
                      {coin.pos ? "+" : ""}{coin.chg}%
                    </span>
                  </div>
                  <div className="ticker-price">${coin.fmt(coin.price ?? 0)}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── EXPERIENCE SECTION ──────────────────────────────────── */}
      <section className="experience-section">
        <div className="landing-container">
          <ScrollReveal>
            <div className="section-header-center">
              <span className="section-badge">PLATFORM EXPERIENCE</span>
              <h2 className="section-title">Everything you need to trade with confidence</h2>
              <p className="section-subtitle">Professional tools without unnecessary complexity.</p>
            </div>
          </ScrollReveal>
          <div className="experience-grid">
            <ScrollReveal delay={0}>
              <div className="exp-card">
                <div>
                  <h3 className="exp-card-title">Professional Trading Terminal</h3>
                  <p className="exp-card-desc">
                    Access live order books, real-time depth charts, flexible order types
                    (Market, Limit, Stop), and technical drawing indicators built for active traders.
                  </p>
                </div>
                <div className="exp-card-visual">
                  <div className="exp-depth-header">
                    <span>BTC / USDT Order Depth</span>
                    <span className="exp-live-tag">
                      <span className="live-dot-indicator" style={{ width: 6, height: 6 }} />LIVE
                    </span>
                  </div>
                  <div className="exp-depth-bar-wrap">
                    <div className="exp-depth-buy"  style={{ flex: 0.52 }}>Buy 52%</div>
                    <div className="exp-depth-sell" style={{ flex: 0.48 }}>Sell 48%</div>
                  </div>
                  <div className="exp-price-row">
                    <span className="exp-bid">{prices.BTC ? prices.BTC.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}</span>
                    <span className="exp-ask">{prices.BTC ? (prices.BTC + 1.2).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="exp-card">
                <div>
                  <h3 className="exp-card-title">Portfolio & Asset Management</h3>
                  <p className="exp-card-desc">
                    Track total portfolio balance, net earnings, transaction timelines,
                    and asset allocations in one unified clean interface.
                  </p>
                </div>
                <div className="exp-card-visual">
                  <div className="exp-portfolio-val">$24,568.00</div>
                  <div className="exp-portfolio-pct">
                    <TrendingUp size={14} />+12.35% this month
                  </div>
                  <svg viewBox="0 0 200 50" style={{ width: "100%", height: 44, marginTop: 8 }}>
                    <defs>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00C2C7" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#00C2C7" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 40 Q 50 20 100 30 T 200 8 L 200 50 L 0 50 Z" fill="url(#expGrad)" />
                    <path d="M 0 40 Q 50 20 100 30 T 200 8" fill="none" stroke="#00C2C7" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── WHY WAYMORE ─────────────────────────────────────────── */}
      <section className="why-section">
        <div className="landing-container">
          <ScrollReveal>
            <div className="section-header-center">
              <span className="section-badge">WHY WAYMORE</span>
              <h2 className="section-title">Built for speed, security, and global accessibility</h2>
            </div>
          </ScrollReveal>
          <div className="why-grid">
            {[
              { icon: <Zap size={24} />,    title: "Ultra-Low Latency",      desc: "Engineered for sub-second execution speeds, ensuring your market orders enter the ledger instantly.", delay: 0   },
              { icon: <Lock size={24} />,   title: "Institutional Security", desc: "Multi-signature cold storage vaults, end-to-end encrypted sessions, and automated anomaly prevention.", delay: 100 },
              { icon: <Globe size={24} />,  title: "Global Markets",         desc: "Trade crypto assets and gold (XAU) worldwide with seamless instant currency conversion.", delay: 200 },
            ].map((w, i) => (
              <ScrollReveal key={i} delay={w.delay}>
                <div className="why-card">
                  <div className="why-icon">{w.icon}</div>
                  <h3 className="why-title">{w.title}</h3>
                  <p className="why-desc">{w.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY SECTION ────────────────────────────────────── */}
      <section className="security-section">
        <div className="landing-container">
          <div className="security-box">
            <ScrollReveal>
              <div>
                <span className="security-eyebrow">SECURITY FIRST</span>
                <h2 className="security-title">Built with security at the core</h2>
                <p className="security-desc">
                  WayMore employs bank-grade security protocols, robust identity verification,
                  and multi-factor authentication to protect your funds and personal privacy.
                </p>
                <Link to={user ? "/home" : "/signup"} className="btn-hero-primary">
                  {user ? "Go to Dashboard" : "Create Free Account"} <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>

            <div className="security-right-col">
              <SecurityShield />
              <div className="security-list">
                {[
                  "Multi-Layer Session Encryption",
                  "Cold Storage Vault Protection",
                  "Automated Real-Time Risk Engine",
                  "Strict Withdrawal Safeguards",
                ].map((item, i) => (
                  <ScrollReveal key={i} delay={i * 80}>
                    <div className="sec-item">
                      <CheckCircle2 size={18} className="sec-check-icon" />
                      <span>{item}</span>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="final-cta-section">
        <div className="landing-container">
          <ScrollReveal>
            <div className="cta-banner">
              <div className="cta-orb-cyan" />
              <div className="cta-orb-blue" />
              <h2 className="cta-title">Ready to trade smarter?</h2>
              <p className="cta-desc">
                Join thousands of traders accessing modern professional tools designed for today's financial markets.
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", position: "relative", zIndex: 1 }}>
                {user ? (
                  <Link to="/home" className="btn-hero-primary btn-shimmer">
                    Go to Dashboard <ArrowRight size={16} />
                  </Link>
                ) : (
                  <>
                    <Link to="/signup" className="btn-hero-primary btn-shimmer">
                      Start Trading Now <ArrowRight size={16} />
                    </Link>
                    <Link to="/login" className="btn-hero-secondary">Sign In</Link>
                  </>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <Link to="/" className="landing-logo">
                <Zap className="logo-bolt" size={22} fill="currentColor" />
                <span>
                  <span className="logo-way">Way</span>
                  <span className="logo-more">More</span>
                </span>
              </Link>
              <p style={{ marginTop: 8, color: "#64748B", fontSize: 13, lineHeight: 1.6 }}>
                Next-generation financial operating system for crypto trading and global asset management.
              </p>
            </div>
            {[
              { title: "Markets",  links: [["Bitcoin (BTC)", "/market"], ["Ethereum (ETH)", "/market"], ["Solana (SOL)", "/market"], ["Gold (XAU)", "/market"]] },
              { title: "Platform", links: [["Spot Trading", "/trade"], ["Quick Trade", "/trade"], ["Live Ticker", "/market"], ["Market News", "/news"]] },
              { title: "Account",  links: [["Sign In", "/login"], ["Create Account", "/signup"], ["Verification", "/verification"], ["Security Center", "/settings"]] },
              { title: "Company",  links: [["Regulatory Info", "/regulatory-info"], ["Support", "/live-chat"], ["Privacy Policy", "/regulatory-info"], ["Terms of Service", "/regulatory-info"]] },
            ].map(col => (
              <div key={col.title}>
                <div className="footer-col-title">{col.title}</div>
                <div className="footer-links">
                  {col.links.map(([label, path]) => (
                    <Link key={label} to={path} className="footer-link">{label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} WayMore Trading. All rights reserved.</span>
            <span>Built with precision for serious traders.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

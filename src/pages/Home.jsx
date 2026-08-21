// src/pages/Home.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { openTrade } from "../services/tradeService";
import {
  ArrowDownLeft, ArrowUpRight, RefreshCw,
  Eye, EyeOff, TrendingUp, TrendingDown,
  Plus, Minus,
  ChevronDown, Search, X, AlertCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import MiniSpark from "../components/MiniSpark";
import Toast from "../components/Toast";
import "./Home.css";

// ── Greeting ─────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── Sparkline Tooltip ─────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="home-chart-tooltip">
      ${Number(payload[0].value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </div>
  );
}

// ── Default Supported Pairs ───────────────────────────────────────
const SUPPORTED_PAIRS = [
  { id: "gold", symbol: "XAU", name: "Gold", pair: "XAU / USD", defaultPrice: 2412.50, change: 0.45, icon: "⚜", color: "#F5C842", isGold: true },
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", pair: "BTC / USDT", defaultPrice: 62816.00, change: -1.40, icon: "₿", color: "#F7931A" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", pair: "ETH / USDT", defaultPrice: 2485.50, change: -0.50, icon: "Ξ", color: "#627EEA" },
  { id: "solana", symbol: "SOL", name: "Solana", pair: "SOL / USDT", defaultPrice: 142.80, change: 2.14, icon: "◎", color: "#14F195" },
  { id: "binancecoin", symbol: "BNB", name: "BNB", pair: "BNB / USDT", defaultPrice: 582.40, change: 0.90, icon: "⬡", color: "#F3BA2F" },
  { id: "ripple", symbol: "XRP", name: "XRP", pair: "XRP / USDT", defaultPrice: 0.58, change: 0.80, icon: "✕", color: "#23292F" },
  { id: "cardano", symbol: "ADA", name: "Cardano", pair: "ADA / USDT", defaultPrice: 0.36, change: -1.10, icon: "₳", color: "#0033AD" },
];

const GOLD_INITIAL_COIN = {
  id: "gold",
  name: "Gold",
  symbol: "xau",
  image: null,
  isGold: true,
  current_price: 2412.50,
  price_change_percentage_24h: 0.45,
  sparkline_in_7d: { price: [2380, 2390, 2385, 2398, 2405, 2412.50] }
};

// ── Demo / Visual dataset curves for zero-balance state ──────────
const DEMO_CHART_CURVES = {
  "1D": [42, 45, 43, 50, 48, 56, 52, 60, 57, 65, 62, 70],
  "1W": [38, 42, 49, 46, 58, 54, 63, 59, 68, 74],
  "1M": [35, 40, 38, 48, 52, 47, 59, 64, 60, 71, 67, 75, 72, 80],
  "3M": [30, 36, 42, 39, 51, 48, 62, 57, 69, 65, 78, 73, 84, 80, 88, 92],
  "1Y": [25, 32, 40, 35, 48, 44, 58, 53, 67, 62, 76, 71, 83, 79, 90, 86, 95, 100]
};

// ── SKELETON LOADERS ──────────────────────────────────────────────
function TotalAssetsSkeleton() {
  return (
    <div className="home-hero-card skeleton-card">
      <div className="skeleton skeleton-text" style={{ width: 110, height: 12, marginBottom: 14 }} />
      <div className="skeleton skeleton-text" style={{ width: 210, height: 36, marginBottom: 8 }} />
      <div className="skeleton skeleton-text" style={{ width: 140, height: 14, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 75, borderRadius: 10, marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <div className="skeleton" style={{ flex: 1, height: 40, borderRadius: 12 }} />
        <div className="skeleton" style={{ flex: 1, height: 40, borderRadius: 12 }} />
      </div>
    </div>
  );
}

function QuickTradeSkeleton() {
  return (
    <div className="home-quick-trade-card skeleton-card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="skeleton" style={{ width: 110, height: 28, borderRadius: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: 70 }} />
      </div>
      <div className="skeleton skeleton-text" style={{ width: 160, height: 28, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 45, borderRadius: 8, marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <div className="skeleton" style={{ flex: 1, height: 42, borderRadius: 12 }} />
        <div className="skeleton" style={{ flex: 1, height: 42, borderRadius: 12 }} />
      </div>
    </div>
  );
}

function MarketOverviewSkeleton() {
  return (
    <div className="home-market-card">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="home-market-row-skeleton">
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="skeleton skeleton-text" style={{ width: 80 }} />
            <div className="skeleton skeleton-text" style={{ width: 55 }} />
          </div>
          <div className="skeleton" style={{ width: 70, height: 32, borderRadius: 6 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <div className="skeleton skeleton-text" style={{ width: 70 }} />
            <div className="skeleton skeleton-text" style={{ width: 45 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN HOME COMPONENT ───────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────
  const [balance, setBalance] = useState(0);
  const [mainBalance, setMainBalance] = useState(0);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);

  // Market coins list (Gold + top Cryptos)
  const [coins, setCoins] = useState([GOLD_INITIAL_COIN]);
  const [coinsLoading, setCoinsLoading] = useState(true);
  const [marketError, setMarketError] = useState(null);

  // Quick Trade selected pair state
  const [selectedPair, setSelectedPair] = useState(SUPPORTED_PAIRS[0]); // Default to Gold or BTC
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [pairSearch, setPairSearch] = useState("");
  const [pairTab, setPairTab] = useState("USDT");

  // Buy / Sell Trade Sheets
  const [tradeSheetMode, setTradeSheetMode] = useState(null); // 'buy' | 'sell' | null
  const [tradeAmount, setTradeAmount] = useState("");
  const [selectedPercent, setSelectedPercent] = useState(null);
  const [isSubmittingTrade, setIsSubmittingTrade] = useState(false);
  const [tradeReviewModal, setTradeReviewModal] = useState(null); // confirmation step

  // Chart data
  const [chartPeriod, setChartPeriod] = useState("1W");
  const [chartData, setChartData] = useState([]);

  // Toast state
  const [toast, setToast] = useState(null);

  // Price Flash Tracker
  const [priceFlashes, setPriceFlashes] = useState({});

  // ── Wallet subscription ────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "wallets", user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const main = d.mainBalance !== undefined ? d.mainBalance : (d.balance || 0);
        const trading = d.tradingBalance !== undefined ? d.tradingBalance : 0;
        setMainBalance(main);
        setBalance(main + trading);
      }
      setWalletLoading(false);
    }, (err) => {
      console.error("Wallet error:", err);
      setWalletLoading(false);
    });
    return () => unsub();
  }, [user]);

  // ── Fetch Live Market Data & Integrate Gold ──────────────────────
  const fetchMarketData = useCallback(async () => {
    try {
      setMarketError(null);
      
      // Fetch crypto market data
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1&sparkline=true&price_change_percentage=24h"
      );
      
      // Fetch live XAU Gold rate
      let goldPrice = 2412.50;
      try {
        const xauRes = await fetch("https://api.exchangerate.host/convert?from=XAU&to=USD&amount=1");
        if (xauRes.ok) {
          const xauData = await xauRes.json();
          if (xauData?.result) goldPrice = xauData.result;
        }
      } catch { /* fallback default price */ }

      const goldObj = {
        id: "gold",
        name: "Gold",
        symbol: "xau",
        image: null,
        isGold: true,
        current_price: goldPrice,
        price_change_percentage_24h: 0.45,
        sparkline_in_7d: { price: [2380, 2390, 2385, 2398, 2405, goldPrice] }
      };

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Prepend Gold to Market Overview list!
          const combined = [goldObj, ...data];
          setCoins(combined);

          // Update active pair live price if found
          const matched = combined.find(c => c.symbol.toLowerCase() === selectedPair.symbol.toLowerCase());
          if (matched) {
            setSelectedPair(prev => ({
              ...prev,
              defaultPrice: matched.current_price,
              change: matched.price_change_percentage_24h || prev.change,
              sparkline: matched.sparkline_in_7d?.price?.slice(-24) || []
            }));
          }
        }
      } else {
        // Fallback with Gold + default list
        setCoins([goldObj]);
      }
    } catch (e) {
      console.warn("Market fetch error:", e);
      setMarketError("Market data update slow");
    } finally {
      setCoinsLoading(false);
    }
  }, [selectedPair.symbol]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 15000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // ── SUB-SECOND HIGH-FREQUENCY LIVE MARKET TICKER (~600ms) ──────────
  // Simulates microsecond/millisecond price adjustments & live flashes
  useEffect(() => {
    if (coinsLoading) return;

    const tickInterval = setInterval(() => {
      const flashes = {};

      setCoins(prevCoins => {
        return prevCoins.map(coin => {
          // Random micro tick delta: between -0.08% and +0.08%
          const deltaPct = (Math.random() - 0.495) * 0.0016;
          const oldPrice = coin.current_price;
          const newPrice = Math.max(0.0001, parseFloat((oldPrice * (1 + deltaPct)).toFixed(coin.isGold ? 2 : coin.current_price < 2 ? 4 : 2)));
          
          if (newPrice !== oldPrice) {
            flashes[coin.id] = newPrice > oldPrice ? "up" : "down";
          }

          const newChange = (coin.price_change_percentage_24h || 0) + (deltaPct * 100);

          // Update selected pair if matched
          if (coin.symbol.toLowerCase() === selectedPair.symbol.toLowerCase()) {
            setSelectedPair(sp => ({
              ...sp,
              defaultPrice: newPrice,
              change: newChange
            }));
          }

          return {
            ...coin,
            current_price: newPrice,
            price_change_percentage_24h: newChange
          };
        });
      });

      if (Object.keys(flashes).length > 0) {
        setPriceFlashes(flashes);
        setTimeout(() => setPriceFlashes({}), 450);
      }
    }, 650); // Microsecond / Sub-second live price tick every 650ms!

    return () => clearInterval(tickInterval);
  }, [coinsLoading, selectedPair.symbol]);

  // ── Generate Portfolio Chart Data ────────────────────────────────
  useEffect(() => {
    if (!balance || balance === 0) {
      // Use visual demo dataset curve for zero balance state
      const curve = DEMO_CHART_CURVES[chartPeriod] || DEMO_CHART_CURVES["1W"];
      const data = curve.map((v, i) => ({ i, v }));
      setChartData(data);
      return;
    }

    const points = chartPeriod === "1D" ? 24 : chartPeriod === "1W" ? 7 : chartPeriod === "1M" ? 30 : chartPeriod === "3M" ? 90 : 365;
    const base = balance;
    const data = [];
    let cur = base * 0.94;
    for (let i = 0; i < points; i++) {
      cur = cur + (Math.random() - 0.47) * base * 0.02;
      cur = Math.max(cur, base * 0.7);
      data.push({ i, v: parseFloat(cur.toFixed(2)) });
    }
    data.push({ i: points, v: parseFloat(base.toFixed(2)) });
    setChartData(data);
  }, [balance, chartPeriod]);

  // ── Calculate Performance & Zero-Balance Guard ───────────────────
  const hasZeroBalance = balance === 0;
  const pnl = !hasZeroBalance && chartData.length > 1 ? balance - chartData[0]?.v : 0;
  const pnlPct = !hasZeroBalance && chartData[0]?.v > 0 ? ((pnl / chartData[0].v) * 100) : 0;
  const isUp = pnl >= 0;

  // Format balance string: $•••••••• when hidden (using bullets)
  const displayBalance = balanceHidden
    ? "$••••••••"
    : `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const displayPnlText = balanceHidden
    ? "••••"
    : hasZeroBalance
      ? "No change today"
      : `${isUp ? "+" : ""}$${Math.abs(pnl).toFixed(2)}`;

  const displayPctText = balanceHidden
    ? "••%"
    : hasZeroBalance
      ? ""
      : `${isUp ? "+" : ""}${pnlPct.toFixed(2)}% today`;

  const displayName = user?.displayName || user?.name || user?.email?.split("@")[0] || "Trader";

  // ── Filter Pairs for Pair Selector Sheet ────────────────────────
  const filteredPairs = SUPPORTED_PAIRS.filter(p => {
    const q = pairSearch.trim().toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.symbol.toLowerCase().includes(q);
    if (pairTab === "Favorites") return matchQ && (p.symbol === "XAU" || p.symbol === "BTC" || p.symbol === "ETH");
    if (pairTab === "BTC") return matchQ && (p.symbol === "BTC" || p.symbol === "ETH");
    return matchQ;
  });

  // ── Quick Buy / Quick Sell Helpers ──────────────────────────────
  const handleOpenTradeSheet = (mode) => {
    setTradeSheetMode(mode);
    setTradeAmount("");
    setSelectedPercent(null);
  };

  const handleApplyPercent = (pct) => {
    setSelectedPercent(pct);
    if (tradeSheetMode === "buy") {
      const maxSpend = mainBalance > 0 ? mainBalance : 500;
      const amt = (maxSpend * (pct / 100)).toFixed(2);
      setTradeAmount(amt);
    } else {
      const coinAmt = 0.5 * (pct / 100);
      setTradeAmount(coinAmt.toFixed(4));
    }
  };

  const handleReviewTrade = (e) => {
    e.preventDefault();
    const numAmt = parseFloat(tradeAmount);
    if (!numAmt || numAmt <= 0) {
      setToast({ message: "Please enter a valid trade amount", type: "error" });
      return;
    }
    setTradeReviewModal({
      mode: tradeSheetMode,
      amount: numAmt,
      pair: selectedPair,
      estimatedOut: tradeSheetMode === "buy"
        ? (numAmt / selectedPair.defaultPrice).toFixed(6)
        : (numAmt * selectedPair.defaultPrice).toFixed(2)
    });
  };

  const handleConfirmExecuteTrade = async () => {
    if (!tradeReviewModal || !user?.uid) return;
    setIsSubmittingTrade(true);
    try {
      await openTrade(user.uid, {
        coin: { symbol: selectedPair.symbol, name: selectedPair.name },
        side: tradeReviewModal.mode,
        amount: tradeReviewModal.mode === "buy" ? tradeReviewModal.amount : parseFloat(tradeReviewModal.estimatedOut),
        entryPrice: selectedPair.defaultPrice,
        type: "delivery",
        duration: "60s"
      });
      setToast({
        message: `Successfully executed Quick ${tradeReviewModal.mode.toUpperCase()} order for ${selectedPair.symbol}!`,
        type: "success"
      });
      setTradeReviewModal(null);
      setTradeSheetMode(null);
    } catch (err) {
      console.error("Trade error:", err);
      setToast({
        message: err.message || "Failed to execute order. Check trading balance.",
        type: "error"
      });
    } finally {
      setIsSubmittingTrade(false);
    }
  };

  return (
    <div className="home-page">

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Page Header / Greeting ──────────────────────────────── */}
      <div className="home-greeting anim-fade-up">
        <div>
          <h1 className="home-greeting-text">{getGreeting()}, {displayName} 👋</h1>
          <p className="home-greeting-sub">Welcome to your financial command center.</p>
        </div>
        <div className="live-ticker-badge">
          <span className="live-dot" /> LIVE
        </div>
      </div>

      {/* Desktop Main Grid Wrapper */}
      <div className="home-main-grid">

        {/* ── LEFT COLUMN ────────────────────────────────────────── */}
        <div className="home-left-col">

          {/* =======================================================
             SECTION 1 — TOTAL ASSETS (15–20% more compact)
             ======================================================= */}
          {walletLoading ? <TotalAssetsSkeleton /> : (
            <section className="home-hero-card" aria-label="Total Assets">

              {/* Premium Futuristic Ambient Backdrop & Floating Token Constellation */}
              <div className="hero-futuristic-bg" aria-hidden="true">
                {/* Ambient Soft Glow Haze */}
                <div className="ambient-glow-haze" />
                <div className="ambient-glow-haze-teal" />
                <div className="ambient-glow-haze-warm" />

                {/* Floating Ambient Sparkles (6 total) */}
                <span className="ambient-particle p1" />
                <span className="ambient-particle p2" />
                <span className="ambient-particle p3" />
                <span className="ambient-particle p4" />
                <span className="ambient-particle p5" />
                <span className="ambient-particle p6" />

                {/* Orbital Traces SVG (behind coins) */}
                <svg className="orbital-traces-svg" viewBox="0 0 320 155" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* BTC orbit - larger elliptical */}
                  <ellipse className="orbit-trace orbit-btc" cx="88" cy="52" rx="38" ry="22" />
                  {/* ETH orbit - medium */}
                  <ellipse className="orbit-trace orbit-eth" cx="268" cy="78" rx="30" ry="18" />
                  {/* XAU orbit - faint gold */}
                  <ellipse className="orbit-trace orbit-xau" cx="288" cy="30" rx="26" ry="15" />
                </svg>

                {/* Connection Lines SVG (digital network traces) */}
                <svg className="connection-lines-svg" viewBox="0 0 320 155" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* BTC → ETH */}
                  <path className="conn-line conn-btc-eth" d="M100 52 Q180 30 268 78" />
                  {/* USDT → BTC */}
                  <path className="conn-line conn-usdt-btc" d="M148 20 Q120 35 100 52" />
                  {/* ETH → SOL */}
                  <path className="conn-line conn-eth-sol" d="M268 78 Q265 100 252 125" />
                </svg>

                {/* Suspended Crypto Token Constellation (Upper & Center Right) */}
                <div className="suspended-coins-container">
                  {/* 1. USDT (Tether) */}
                  <div className="suspended-coin coin-usdt" title="Tether (USDT)">
                    <div className="coin-halo usdt-halo" />
                    <div className="token-badge-circle usdt-badge">
                      <span>₮</span>
                      <div className="coin-inner-highlight" />
                    </div>
                    <span className="token-ticker">USDT</span>
                  </div>

                  {/* 2. XAU (Gold Ingot) */}
                  <div className="suspended-coin coin-xau" title="Gold (XAU)">
                    <div className="coin-halo xau-halo" />
                    <div className="token-badge-circle xau-badge">
                      <span>⚜</span>
                      <div className="coin-inner-highlight" />
                    </div>
                    <span className="token-ticker">XAU</span>
                  </div>

                  {/* 3. BTC (Bitcoin) - Central & Prominent */}
                  <div className="suspended-coin coin-btc" title="Bitcoin (BTC)">
                    <div className="coin-halo btc-halo" />
                    <div className="token-badge-circle btc-badge">
                      <span>₿</span>
                      <div className="coin-inner-highlight" />
                    </div>
                    <span className="token-ticker">BTC</span>
                  </div>

                  {/* 4. ETH (Ethereum) - Prominent */}
                  <div className="suspended-coin coin-eth" title="Ethereum (ETH)">
                    <div className="coin-halo eth-halo" />
                    <div className="token-badge-circle eth-badge">
                      <span>Ξ</span>
                      <div className="coin-inner-highlight" />
                    </div>
                    <span className="token-ticker">ETH</span>
                  </div>

                  {/* 5. SOL (Solana) */}
                  <div className="suspended-coin coin-sol" title="Solana (SOL)">
                    <div className="coin-halo sol-halo" />
                    <div className="token-badge-circle sol-badge">
                      <span>◎</span>
                      <div className="coin-inner-highlight" />
                    </div>
                    <span className="token-ticker">SOL</span>
                  </div>
                </div>
              </div>

              {/* Card Header & Privacy Toggle */}
              <div className="hero-header">
                <div>
                  <span className="hero-label">Total Portfolio</span>
                  <div className="hero-balance-row">
                    <span className={`hero-balance ${balanceHidden ? "blurred" : ""}`}>
                      {displayBalance}
                    </span>
                    <button
                      className="eye-btn"
                      onClick={() => setBalanceHidden(v => !v)}
                      aria-label={balanceHidden ? "Show balance" : "Hide balance"}
                      title={balanceHidden ? "Show balance" : "Hide balance"}
                    >
                      {balanceHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>

                  {/* Return / Change Subline */}
                  <div className="hero-pnl-row">
                    {hasZeroBalance ? (
                      <>
                        <span className="hero-pnl neutral">{displayPnlText}</span>
                        <span className="hero-pct positive">
                          <span className="pct-live-dot" /> 0.00%
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={`hero-pnl ${isUp ? "positive" : "negative"}`}>
                          {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          {displayPnlText}
                        </span>
                        {displayPctText && (
                          <span className={`hero-pct ${isUp ? "positive" : "negative"}`}>
                            {displayPctText}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Centerpiece Futuristic Luminous Portfolio Chart */}
              <div className="hero-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 18, right: 14, bottom: 4, left: 14 }}>
                    <defs>
                      <linearGradient id="futuristicHeroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00F2FE" stopOpacity={0.25} />
                        <stop offset="65%" stopColor="#00C2C7" stopOpacity={0.06} />
                        <stop offset="100%" stopColor="#00C2C7" stopOpacity={0} />
                      </linearGradient>
                      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2.2" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="rgba(0, 194, 199, 0.07)" vertical={false} />
                    <XAxis dataKey="i" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="#00F2FE"
                      strokeWidth={2.6}
                      fill="url(#futuristicHeroGrad)"
                      dot={false}
                      filter="url(#neonGlow)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Glowing Endpoint Node Head Pulse */}
                <div className="chart-endpoint-node" aria-hidden="true">
                  <span className="endpoint-core" />
                  <span className="endpoint-pulse-ring" />
                  <span className="endpoint-pulse-ring ring-2" />
                </div>

                {/* Energy Pulse that travels along chart */}
                <div className="chart-energy-pulse" aria-hidden="true" />

                {/* Chart fill shimmer overlay */}
                <div className="chart-fill-shimmer" aria-hidden="true" />
              </div>

              {/* Time Range Selector Tabs (Futuristic Pill & Indicator Dot) */}
              <div className="hero-period-row">
                {["1D", "1W", "1M", "3M", "1Y"].map(p => (
                  <button
                    key={p}
                    className={`hero-period-btn${chartPeriod === p ? " active" : ""}`}
                    onClick={() => setChartPeriod(p)}
                  >
                    {p}
                    {chartPeriod === p && <span className="period-active-dot" />}
                  </button>
                ))}
              </div>

              {/* Deposit / Withdraw Action Buttons */}
              <div className="hero-actions">
                <Link to="/deposit" className="hero-action-btn primary">
                  <ArrowDownLeft size={15} /> Deposit
                </Link>
                <Link to="/withdraw" className="hero-action-btn secondary">
                  <ArrowUpRight size={15} /> Withdraw
                </Link>
              </div>

            </section>
          )}

        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
        <div className="home-right-col">

          {/* =======================================================
             SECTION 2 — QUICK ACTIONS (Compact, 4 circular buttons)
             ======================================================= */}
          <section className="home-section quick-actions-section anim-fade-up delay-2" aria-label="Quick Actions">
            <div className="wm-section-header">
              <h2 className="wm-section-title">Quick Actions</h2>
            </div>
            
            <div className="home-quick-grid">
              {/* Buy */}
              <button
                className="home-quick-item"
                onClick={() => handleOpenTradeSheet("buy")}
              >
                <div className="home-quick-icon buy-icon">
                  <Plus size={18} />
                </div>
                <span className="home-quick-label">Buy</span>
              </button>

              {/* Sell */}
              <button
                className="home-quick-item"
                onClick={() => handleOpenTradeSheet("sell")}
              >
                <div className="home-quick-icon sell-icon">
                  <Minus size={18} />
                </div>
                <span className="home-quick-label">Sell</span>
              </button>

              {/* Transfer */}
              <Link to="/account-transfer" className="home-quick-item">
                <div className="home-quick-icon transfer-icon">
                  <ArrowUpRight size={18} />
                </div>
                <span className="home-quick-label">Transfer</span>
              </Link>

              {/* Convert */}
              <Link to="/exchange" className="home-quick-item">
                <div className="home-quick-icon convert-icon">
                  <RefreshCw size={17} />
                </div>
                <span className="home-quick-label">Convert</span>
              </Link>
            </div>
          </section>

          {/* =======================================================
             SECTION 3 — QUICK TRADE
             ======================================================= */}
          <section className="home-section anim-fade-up delay-3" aria-label="Quick Trade">
            <div className="wm-section-header">
              <h2 className="wm-section-title">Quick Trade</h2>
              <Link to="/trade" className="wm-section-link">Full Trade →</Link>
            </div>

            {coinsLoading && !selectedPair.sparkline ? <QuickTradeSkeleton /> : (
              <div className="home-quick-trade-card">
                
                {/* Pair Selector Trigger */}
                <div className="quick-trade-header">
                  <button
                    className="pair-selector-btn"
                    onClick={() => setShowPairSelector(true)}
                  >
                    <span>{selectedPair.pair}</span>
                    <ChevronDown size={14} className="pair-arrow" />
                  </button>
                  <span className="quick-trade-badge">{selectedPair.isGold ? "COMMODITY" : "SPOT"}</span>
                </div>

                {/* Selected Asset Info & Price with Microsecond Flash Ticker */}
                <div className="quick-trade-asset-row">
                  <div className="quick-trade-asset-info">
                    <span className="quick-trade-icon" style={{ background: `${selectedPair.color}1A`, color: selectedPair.color }}>
                      {selectedPair.icon}
                    </span>
                    <div>
                      <div className="quick-trade-name">{selectedPair.name}</div>
                      <div className="quick-trade-symbol">{selectedPair.symbol}</div>
                    </div>
                  </div>

                  <div className="quick-trade-price-col">
                    <span className={`quick-trade-price ${priceFlashes[selectedPair.id] ? `flash-${priceFlashes[selectedPair.id]}` : ""}`}>
                      ${selectedPair.defaultPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: selectedPair.defaultPrice < 1 ? 4 : 2 })}
                    </span>
                    <span className={`quick-trade-change ${selectedPair.change >= 0 ? "positive" : "negative"}`}>
                      {selectedPair.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {Math.abs(selectedPair.change).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Mini Sparkline Chart */}
                <div className="quick-trade-sparkline">
                  <MiniSpark
                    prices={selectedPair.sparkline || [2380, 2390, 2400, 2405, 2412.50]}
                    up={selectedPair.change >= 0}
                  />
                </div>

                {/* Buy / Sell Quick Buttons */}
                <div className="quick-trade-actions">
                  <button
                    className="btn-buy flex-1"
                    onClick={() => handleOpenTradeSheet("buy")}
                  >
                    BUY
                  </button>
                  <button
                    className="btn-sell flex-1"
                    onClick={() => handleOpenTradeSheet("sell")}
                  >
                    SELL
                  </button>
                </div>

              </div>
            )}
          </section>

        </div>

      </div>

      {/* ===========================================================
         SECTION 4 — MARKET OVERVIEW (With Gold + Live Ticker)
         =========================================================== */}
      <section className="home-section market-overview-section anim-fade-up delay-4" aria-label="Market Overview">
        <div className="wm-section-header">
          <h2 className="wm-section-title">Market Overview</h2>
          <Link to="/market" className="wm-section-link">See all →</Link>
        </div>

        {coinsLoading && coins.length === 0 ? (
          <MarketOverviewSkeleton />
        ) : marketError && coins.length === 0 ? (
          <div className="wm-empty">
            <AlertCircle size={24} style={{ color: "var(--wm-warning)" }} />
            <p className="wm-empty-title">Market Data Delayed</p>
            <button className="btn-secondary" onClick={fetchMarketData}>Try again</button>
          </div>
        ) : (
          <div className="home-market-card">
            {coins.slice(0, 6).map((coin) => {
              const isUp = (coin.price_change_percentage_24h || 0) >= 0;
              const prices = (coin.sparkline_in_7d?.price || []).slice(-24);
              const flashClass = priceFlashes[coin.id] ? `flash-${priceFlashes[coin.id]}` : "";
              return (
                <Link
                  key={coin.id}
                  to={coin.isGold ? "/market" : `/coin/${coin.id}`}
                  className={`home-market-row${coin.isGold ? " gold-row" : ""}`}
                >
                  <div className="market-row-left">
                    {coin.isGold ? (
                      <span className="home-coin-icon gold-emblem">⚜</span>
                    ) : (
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="home-coin-img"
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    )}
                    <div className="home-coin-info">
                      <span className="home-coin-name">
                        {coin.symbol.toUpperCase()}
                        {coin.isGold && <span className="gold-tag">GOLD</span>}
                      </span>
                      <span className="home-coin-fullname">{coin.name}</span>
                    </div>
                  </div>

                  <div className="market-row-spark">
                    <MiniSpark prices={prices.length ? prices : [2380, 2400, 2412]} up={isUp} />
                  </div>

                  <div className="home-coin-right">
                    <span className={`home-coin-price ${flashClass}`}>
                      ${coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: coin.current_price < 1 ? 4 : 2 })}
                    </span>
                    <span className={`home-coin-change ${isUp ? "positive" : "negative"}`}>
                      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>


      {/* ===========================================================
         MODAL / BOTTOM SHEET — PAIR SELECTOR
         =========================================================== */}
      {showPairSelector && (
        <div className="wm-overlay" onClick={() => setShowPairSelector(false)}>
          <div className="wm-bottom-sheet pair-selector-sheet" onClick={e => e.stopPropagation()}>
            <div className="wm-sheet-handle" />

            <div className="sheet-header">
              <h3 className="sheet-title">Select Market</h3>
              <button className="sheet-close-btn" onClick={() => setShowPairSelector(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="sheet-search-wrap">
              <Search size={16} className="sheet-search-icon" />
              <input
                type="text"
                className="sheet-search-input"
                placeholder="Search Gold, BTC, ETH..."
                value={pairSearch}
                onChange={e => setPairSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Category Filter Pills */}
            <div className="sheet-tabs">
              {["USDT", "Favorites", "BTC"].map(t => (
                <button
                  key={t}
                  className={`sheet-tab${pairTab === t ? " active" : ""}`}
                  onClick={() => setPairTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Supported Pairs List */}
            <div className="sheet-pair-list">
              {filteredPairs.map(p => {
                const isSelected = selectedPair.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={`sheet-pair-row${isSelected ? " selected" : ""}`}
                    onClick={() => {
                      setSelectedPair(p);
                      setShowPairSelector(false);
                    }}
                  >
                    <div className="sheet-pair-left">
                      <span className="sheet-pair-icon" style={{ background: `${p.color}1F`, color: p.color }}>
                        {p.icon}
                      </span>
                      <div>
                        <div className="sheet-pair-symbol">{p.pair}</div>
                        <div className="sheet-pair-name">{p.name}</div>
                      </div>
                    </div>

                    <div className="sheet-pair-right">
                      <span className="sheet-pair-price">${p.defaultPrice.toLocaleString()}</span>
                      <span className={`sheet-pair-change ${p.change >= 0 ? "positive" : "negative"}`}>
                        {p.change >= 0 ? "+" : ""}{p.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* ===========================================================
         MODAL / BOTTOM SHEET — QUICK BUY & QUICK SELL FLOW
         =========================================================== */}
      {tradeSheetMode && (
        <div className="wm-overlay" onClick={() => setTradeSheetMode(null)}>
          <div className="wm-bottom-sheet trade-sheet" onClick={e => e.stopPropagation()}>
            <div className="wm-sheet-handle" />

            <div className="sheet-header">
              <h3 className="sheet-title">
                {tradeSheetMode === "buy" ? `Buy ${selectedPair.name}` : `Sell ${selectedPair.name}`}
              </h3>
              <button className="sheet-close-btn" onClick={() => setTradeSheetMode(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="trade-sheet-info">
              <span className="trade-sheet-pair">{selectedPair.pair}</span>
              <span className="trade-sheet-price">
                Current Price: <strong>${selectedPair.defaultPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
              </span>
            </div>

            <form onSubmit={handleReviewTrade} className="trade-sheet-form">
              <div className="form-group">
                <label className="wm-label">
                  {tradeSheetMode === "buy" ? "You Spend (USDT)" : `Amount (${selectedPair.symbol})`}
                </label>
                <div className="trade-input-wrap">
                  <input
                    type="number"
                    step="any"
                    className="wm-input trade-input"
                    placeholder="0.00"
                    value={tradeAmount}
                    onChange={e => {
                      setTradeAmount(e.target.value);
                      setSelectedPercent(null);
                    }}
                    required
                  />
                  <span className="trade-input-currency">
                    {tradeSheetMode === "buy" ? "USDT" : selectedPair.symbol}
                  </span>
                </div>
              </div>

              {/* Percentage Quick Selector */}
              <div className="percent-row">
                {[25, 50, 75, 100].map(pct => (
                  <button
                    type="button"
                    key={pct}
                    className={`percent-btn${selectedPercent === pct ? " active" : ""}`}
                    onClick={() => handleApplyPercent(pct)}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Estimate Breakdown */}
              <div className="trade-estimate-box">
                <span className="estimate-label">
                  {tradeSheetMode === "buy" ? `Estimated ${selectedPair.symbol}` : "Estimated USDT"}
                </span>
                <span className="estimate-val">
                  {tradeAmount && parseFloat(tradeAmount) > 0
                    ? tradeSheetMode === "buy"
                      ? `${(parseFloat(tradeAmount) / selectedPair.defaultPrice).toFixed(6)} ${selectedPair.symbol}`
                      : `$${(parseFloat(tradeAmount) * selectedPair.defaultPrice).toFixed(2)} USDT`
                    : `0.00 ${tradeSheetMode === "buy" ? selectedPair.symbol : "USDT"}`}
                </span>
              </div>

              {/* Review Button */}
              <button
                type="submit"
                className={`btn-${tradeSheetMode} full-width-btn`}
              >
                Review {tradeSheetMode === "buy" ? "Buy" : "Sell"}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ===========================================================
         CONFIRMATION / REVIEW TRADE MODAL
         =========================================================== */}
      {tradeReviewModal && (
        <div className="wm-overlay" onClick={() => setTradeReviewModal(null)}>
          <div className="glass-card review-modal" onClick={e => e.stopPropagation()}>
            <h3 className="review-title">Confirm Quick {tradeReviewModal.mode.toUpperCase()}</h3>

            <div className="review-rows">
              <div className="review-row">
                <span>Asset</span>
                <strong>{tradeReviewModal.pair.name} ({tradeReviewModal.pair.symbol})</strong>
              </div>
              <div className="review-row">
                <span>Price</span>
                <strong>${tradeReviewModal.pair.defaultPrice.toLocaleString()}</strong>
              </div>
              <div className="review-row">
                <span>{tradeReviewModal.mode === "buy" ? "You Spend" : "You Sell"}</span>
                <strong>{tradeReviewModal.amount} {tradeReviewModal.mode === "buy" ? "USDT" : tradeReviewModal.pair.symbol}</strong>
              </div>
              <div className="review-row highlight">
                <span>Estimated Receive</span>
                <strong>{tradeReviewModal.estimatedOut} {tradeReviewModal.mode === "buy" ? tradeReviewModal.pair.symbol : "USDT"}</strong>
              </div>
            </div>

            <div className="review-actions">
              <button
                className="btn-secondary flex-1"
                onClick={() => setTradeReviewModal(null)}
                disabled={isSubmittingTrade}
              >
                Cancel
              </button>
              <button
                className={`btn-${tradeReviewModal.mode} flex-1`}
                onClick={handleConfirmExecuteTrade}
                disabled={isSubmittingTrade}
              >
                {isSubmittingTrade ? "Processing..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

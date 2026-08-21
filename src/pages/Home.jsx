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
    if (balance === 0 && walletLoading) {
      setChartData([]);
      return;
    }
    const points = chartPeriod === "1D" ? 24 : chartPeriod === "1W" ? 7 : chartPeriod === "1M" ? 30 : chartPeriod === "3M" ? 90 : 365;
    const base = balance || 100;
    const data = [];
    let cur = base * (balance > 0 ? 0.94 : 1);
    for (let i = 0; i < points; i++) {
      if (balance === 0) {
        data.push({ i, v: 0 });
      } else {
        cur = cur + (Math.random() - 0.47) * base * 0.02;
        cur = Math.max(cur, base * 0.7);
        data.push({ i, v: parseFloat(cur.toFixed(2)) });
      }
    }
    if (balance > 0) {
      data.push({ i: points, v: parseFloat(base.toFixed(2)) });
    }
    setChartData(data);
  }, [balance, chartPeriod, walletLoading]);

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
            <section className="home-hero-card anim-fade-up delay-1" aria-label="Total Assets">

              {/* Futuristic Animated Backdrop: Waving Line, Orbit Rings & 3D Floating Coins */}
              <div className="hero-futuristic-bg" aria-hidden="true">
                <svg className="futuristic-wave-svg" viewBox="0 0 320 130" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00C2C7" stopOpacity="0.9" />
                      <stop offset="45%" stopColor="#F5C842" stopOpacity="1" />
                      <stop offset="85%" stopColor="#3B82F6" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="waveGradient2" x1="100%" y1="0%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.75" />
                      <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#00C2C7" stopOpacity="0.75" />
                    </linearGradient>
                    <filter id="waveGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Wave 1: Primary Electric Wave */}
                  <path
                    d="M 0 50 C 40 10, 80 85, 130 40 C 180 -5, 230 75, 320 35"
                    className="wave-line-1"
                    stroke="url(#waveGradient1)"
                    filter="url(#waveGlow)"
                  />
                  {/* Wave 2: Secondary Interlocking Wave */}
                  <path
                    d="M 0 75 C 60 105, 120 25, 190 80 C 250 120, 280 40, 320 60"
                    className="wave-line-2"
                    stroke="url(#waveGradient2)"
                    filter="url(#waveGlow)"
                  />
                  {/* Wave 3: Subtle Background Spark Line */}
                  <path
                    d="M 0 35 Q 80 85, 160 30 T 320 70"
                    className="wave-line-3"
                    stroke="rgba(245, 200, 66, 0.45)"
                  />
                </svg>

                {/* Orbit Laser Rings */}
                <div className="coin-orbit-ring ring-gold"></div>
                <div className="coin-orbit-ring ring-btc"></div>

                {/* Floating 3D Coins */}
                <div className="floating-coin gold-coin" title="Gold (XAU)">
                  <div className="coin-3d-wrapper">
                    <div className="coin-face coin-front">
                      <span className="coin-icon">⚜</span>
                      <span className="coin-symbol">XAU</span>
                    </div>
                  </div>
                  <div className="coin-glow gold-glow"></div>
                  <div className="coin-ring gold-ring"></div>
                </div>

                <div className="floating-coin btc-coin" title="Bitcoin (BTC)">
                  <div className="coin-3d-wrapper">
                    <div className="coin-face coin-front">
                      <span className="coin-icon">₿</span>
                      <span className="coin-symbol">BTC</span>
                    </div>
                  </div>
                  <div className="coin-glow btc-glow"></div>
                  <div className="coin-ring btc-ring"></div>
                </div>

                <div className="floating-coin eth-coin" title="Ethereum (ETH)">
                  <div className="coin-3d-wrapper">
                    <div className="coin-face coin-front">
                      <span className="coin-icon">Ξ</span>
                      <span className="coin-symbol">ETH</span>
                    </div>
                  </div>
                  <div className="coin-glow eth-glow"></div>
                </div>

                <div className="floating-coin sol-coin" title="Solana (SOL)">
                  <div className="coin-3d-wrapper">
                    <div className="coin-face coin-front">
                      <span className="coin-icon">◎</span>
                      <span className="coin-symbol">SOL</span>
                    </div>
                  </div>
                  <div className="coin-glow sol-glow"></div>
                </div>

                {/* Ambient Tech Particles */}
                <span className="tech-dot dot-1" />
                <span className="tech-dot dot-2" />
                <span className="tech-dot dot-3" />
                <span className="tech-dot dot-4" />
                <span className="tech-dot dot-5" />
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
                      {balanceHidden ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Return / Change Subline */}
                  <div className="hero-pnl-row">
                    {hasZeroBalance ? (
                      <span className="hero-pnl neutral">{displayPnlText}</span>
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

              {/* Shorter Responsive Portfolio Chart */}
              <div className="hero-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isUp ? "#00C2C7" : "#EF4444"} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={isUp ? "#00C2C7" : "#EF4444"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.04)" vertical={false} />
                    <XAxis dataKey="i" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={isUp ? "#00C2C7" : "#EF4444"}
                      strokeWidth={2}
                      fill="url(#heroGrad)"
                      dot={false}
                      animationDuration={600}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Time Range Selector Tabs */}
              <div className="hero-period-row">
                {["1D", "1W", "1M", "3M", "1Y"].map(p => (
                  <button
                    key={p}
                    className={`hero-period-btn${chartPeriod === p ? " active" : ""}`}
                    onClick={() => setChartPeriod(p)}
                  >
                    {p}
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

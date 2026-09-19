import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  openTrade,
  checkAndAutoCloseTrades,
  resetDemoBalance,
  getGuestDemoBalance,
  openGuestTrade,
  resetGuestDemoBalance,
  checkAndAutoCloseGuestTrades
} from "../services/tradeService";
import { getCryptoPrices } from "../services/priceService";
import TradingChart from "../components/TradingChart";
import ActiveTradeModal from "../components/ActiveTradeModal";
import AlertModal from "../components/AlertModal";
import Positions from "../components/Positions";
import OrderBook from "../components/OrderBook";
import coinList from "../data/coinList";
import "./TradeBinary.css";
import "./TradePerpetual.css";

import { onSnapshot, doc, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";

export default function Trade() {
  const { user } = useAuth();
  const location = useLocation();

  // Mode: 'real' | 'demo' (guests always default to demo)
  const [tradeMode, setTradeMode] = useState(() => {
    if (!user) return "demo";
    const params = new URLSearchParams(location.search);
    if (params.get("demo") === "true") return "demo";
    if (params.get("demo") === "false") return "real";
    return localStorage.getItem("investfx_trade_mode") || "demo";
  });

  useEffect(() => {
    if (!user) {
      setTradeMode("demo");
      return;
    }
    const params = new URLSearchParams(location.search);
    if (params.get("demo") === "true") {
      setTradeMode("demo");
      localStorage.setItem("investfx_trade_mode", "demo");
    } else if (params.get("demo") === "false") {
      setTradeMode("real");
      localStorage.setItem("investfx_trade_mode", "real");
    }
  }, [location.search, user]);

  const [tradingBalance, setTradingBalance] = useState(0);
  const [demoBalance, setDemoBalance] = useState(10000);
  const [guestBalance, setGuestBalance] = useState(getGuestDemoBalance);
  const [isResetting, setIsResetting] = useState(false);
  const [authPromptModal, setAuthPromptModal] = useState(false);

  const [coinMeta, setCoinMeta] = useState(() => {
    const stateCoin = location.state?.coin;
    if (stateCoin) {
      return {
        id: stateCoin.id || "gold",
        symbol: (stateCoin.symbol || coinList[stateCoin.id]?.symbol || "XAU").toUpperCase(),
        name: stateCoin.name || coinList[stateCoin.id]?.name || "Gold",
      };
    }
    return {
      id: "gold",
      symbol: "XAU",
      name: "Gold",
    };
  });

  const [contractType, setContractType] = useState("delivery"); // delivery (binary) | perpetual
  const [livePrice, setLivePrice] = useState(0);
  const [tickerStats, setTickerStats] = useState({
    change: 0,
    high: 0,
    low: 0,
    volume: 0
  });

  const priceChange = tickerStats.change;
  const highPrice = tickerStats.high || livePrice;
  const lowPrice = tickerStats.low || livePrice;
  const volume24h = tickerStats.volume;
  const [activeTrade, setActiveTrade] = useState(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
  const [selectedDuration, setSelectedDuration] = useState(60); // seconds
  const [chartInterval, setChartInterval] = useState("60"); // 60 min default
  const [leverage, setLeverage] = useState(1);
  const [tradeAmount, setTradeAmount] = useState(10);
  const [activeTrades, setActiveTrades] = useState([]);

  // Perpetual Specific State
  const [perpSide, setPerpSide] = useState('buy'); // 'buy' or 'sell'
  const [perpTab, setPerpTab] = useState('positions'); // 'positions' | 'history'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const map = coinList;
  const isDemo = tradeMode === 'demo';
  const effectiveDemoBalance = user ? demoBalance : guestBalance;
  const effectiveBalance = isDemo ? effectiveDemoBalance : tradingBalance;

  // Guest demo balance & trade updates
  useEffect(() => {
    if (user) return;
    const handleGuestUpdate = () => {
      setGuestBalance(getGuestDemoBalance());
    };
    window.addEventListener("investfx_guest_trade_update", handleGuestUpdate);
    return () => window.removeEventListener("investfx_guest_trade_update", handleGuestUpdate);
  }, [user]);

  // Guest heartbeat for auto-closing expired demo trades
  useEffect(() => {
    if (user) return;
    const interval = setInterval(async () => {
      try {
        const prices = await getCryptoPrices();
        await checkAndAutoCloseGuestTrades(prices);
      } catch (err) {
        console.error("Guest trade auto-close error:", err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [user]);

  // Subscribe to trading balance, demo balance, and active trades for logged-in users
  useEffect(() => {
    if (!user) return;
    const unsubWallet = onSnapshot(doc(db, "wallets", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const bal = parseFloat(data.tradingBalance);
        setTradingBalance(!isNaN(bal) ? bal : 0);

        const dBal = data.demoBalance !== undefined ? parseFloat(data.demoBalance) : 10000;
        setDemoBalance(!isNaN(dBal) ? dBal : 10000);
      }
    });

    const tradesQuery = query(
      collection(db, "trades"),
      where("uid", "==", user.uid),
      where("status", "==", "active")
    );
    const unsubTrades = onSnapshot(tradesQuery, (snapshot) => {
      const trades = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiresAt: doc.data().expiresAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setActiveTrades(trades);
    });

    return () => {
      unsubWallet();
      unsubTrades();
    };
  }, [user]);

  // Heartbeat monitoring for liquidation and expiration (logged in)
  useEffect(() => {
    if (!user || activeTrades.length === 0) return;

    const heartbeat = setInterval(async () => {
      try {
        const prices = await getCryptoPrices();
        if (activeTrades.length > 0) {
          await checkAndAutoCloseTrades(user.uid, activeTrades, prices);
        }
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    }, 5000);

    return () => clearInterval(heartbeat);
  }, [user, activeTrades]);

  // Handle Reset Demo Balance
  const handleResetDemo = async () => {
    if (isResetting) return;
    try {
      setIsResetting(true);
      if (user) {
        await resetDemoBalance(user.uid, 10000);
      } else {
        resetGuestDemoBalance();
        setGuestBalance(10000);
      }
      setAlertModal({
        isOpen: true,
        message: "🎉 Your practice balance has been reset to $10,000 USDT! Happy trading!"
      });
    } catch (err) {
      console.error("Error resetting demo balance:", err);
      setAlertModal({
        isOpen: true,
        message: "Failed to reset demo balance: " + (err.message || "Please try again.")
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Trade duration options with profit rates
  const tradeDurations = [
    { seconds: 30, profitRate: 15 },
    { seconds: 60, profitRate: 20 },
    { seconds: 120, profitRate: 30 },
    { seconds: 180, profitRate: 50 },
    { seconds: 300, profitRate: 70 },
    { seconds: 360, profitRate: 75 },
    { seconds: 450, profitRate: 80 },
    { seconds: 600, profitRate: 90 },
  ];

  const handleTradeStart = async (direction) => {
    try {
      const amount = Number(tradeAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      if (amount > effectiveBalance) {
        throw new Error(
          isDemo
            ? "Insufficient practice balance. Click 'Reset $10,000' to restore demo funds."
            : "Insufficient trading balance. Please deposit or transfer funds to your trading account."
        );
      }

      let tradeDetails;

      if (contractType === 'delivery') {
        const duration = selectedDuration;
        const durationOption = tradeDurations.find(d => d.seconds === duration);
        tradeDetails = {
          type: 'delivery',
          coin: coinMeta,
          entryPrice: livePrice,
          amount: amount,
          side: direction === 'up' ? 'buy' : 'sell',
          duration: duration + 's',
          profitPercent: durationOption.profitRate,
          isDemo: isDemo,
        };
      } else {
        // Perpetual Logic
        const side = perpSide;
        tradeDetails = {
          type: 'perpetual',
          coin: coinMeta,
          entryPrice: livePrice,
          amount: amount,
          side: side,
          leverage: leverage,
          isDemo: isDemo,
        };
      }

      const result = user
        ? await openTrade(user.uid, tradeDetails)
        : await openGuestTrade(tradeDetails);

      if (contractType === 'delivery') {
        setActiveTrade({
          ...tradeDetails,
          tradeId: result.tradeId,
          startTime: new Date(),
        });
      } else {
        setAlertModal({
          isOpen: true,
          message: `Successfully opened ${isDemo ? '[DEMO] ' : ''}${tradeDetails.side.toUpperCase()} position!`
        });
      }
    } catch (error) {
      console.error("Error opening trade:", error);
      setAlertModal({
        isOpen: true,
        message: error.message || "Failed to open trade. Please check your balance."
      });
    }
  };

  const handlePerpPercentage = (percent) => {
    if (effectiveBalance === undefined || isNaN(effectiveBalance)) {
      console.warn("Cannot calculate percentage: Invalid Balance", effectiveBalance);
      return;
    }

    const factor = percent / 100;
    const margin = effectiveBalance * factor;
    const amount = Math.floor(margin * 100) / 100;
    setTradeAmount(amount);
  };

  const handleTradeClose = () => {
    setActiveTrade(null);
  };

  return (
    <div className={`trade-page binary-options-style ${isDemo ? 'in-demo-mode' : ''}`}>
      {/* Trade Mode Bar (Real vs Demo) */}
      <div className="trade-mode-bar">
        <div className="trade-mode-toggle-group">
          <button
            type="button"
            className={`trade-mode-btn ${tradeMode === 'real' ? 'active-real' : ''}`}
            onClick={() => {
              if (!user) {
                setAuthPromptModal(true);
                return;
              }
              setTradeMode('real');
              localStorage.setItem('investfx_trade_mode', 'real');
            }}
          >
            <span className="mode-indicator-dot real-dot"></span>
            Real Account
          </button>
          <button
            type="button"
            className={`trade-mode-btn ${tradeMode === 'demo' ? 'active-demo' : ''}`}
            onClick={() => {
              setTradeMode('demo');
              localStorage.setItem('investfx_trade_mode', 'demo');
            }}
          >
            <span className="mode-indicator-dot demo-dot"></span>
            Demo Practice
          </button>
        </div>

        {isDemo ? (
          <div className="demo-balance-quick-view">
            <span className="demo-label-pill">🟡 PRACTICE</span>
            <span className="demo-amount-pill">${effectiveDemoBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <button
              type="button"
              className="reset-demo-header-btn"
              onClick={handleResetDemo}
              disabled={isResetting}
              title="Reset practice funds to $10,000"
            >
              {isResetting ? "..." : "🔄 Reset $10K"}
            </button>
          </div>
        ) : (
          <div className="real-balance-quick-view">
            <span className="real-label-pill">🟢 REAL</span>
            <span className="real-amount-pill">${tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>

      {/* Demo Practice Banner */}
      {isDemo && (
        <div className="demo-practice-banner">
          <span className="demo-banner-icon">🎮</span>
          <div className="demo-banner-text">
            <strong>Practice Trading Mode</strong>: Real market prices with risk-free virtual funds.
          </div>
        </div>
      )}

      {/* Contract Type Tabs */}
      <div className="contract-type-tabs">
        <button
          className={`contract-tab ${contractType === 'delivery' ? 'active' : ''}`}
          onClick={() => setContractType('delivery')}
        >
          Delivery Contract
        </button>
        <button
          className={`contract-tab ${contractType === 'perpetual' ? 'active' : ''}`}
          onClick={() => setContractType('perpetual')}
        >
          Perpetual Contract
        </button>
      </div>

      <div className="trade-tab-content">
        {/* Pair Display */}
        <div className="pair-display">
          <div className="pair-info">
            {/* Hamburger menu icon */}
            <span
              style={{ fontSize: '20px', marginRight: '5px', cursor: 'pointer' }}
              onClick={() => setIsDrawerOpen(true)}
            >
              ≡
            </span>
            <span className="pair-name">{coinMeta.symbol} / USDT</span>
            <span className={`pair-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
            {isDemo && <span className="demo-inline-badge">DEMO</span>}
            <span style={{ marginLeft: 'auto' }}>📊</span>
          </div>
        </div>

        {/* Dynamic Content based on Contract Type */}
        {contractType === 'delivery' ? (
          /* ================= DELIVERY MODE UI (Existing) ================= */
          <>
            <div className={`trading-balance-chip ${isDemo ? 'demo-chip' : ''}`}>
              <div className="chip-content">
                <span className="chip-tag">{isDemo ? 'Demo Balance' : 'Trading Balance'}:</span>
                <span className="chip-val">${effectiveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {isDemo && (
                <button
                  type="button"
                  className="reset-demo-inline-btn"
                  onClick={handleResetDemo}
                  disabled={isResetting}
                >
                  {isResetting ? "Resetting..." : "🔄 Reset $10,000"}
                </button>
              )}
            </div>

            {/* Price Display Section */}
            <div className="price-display-section">
              <div className="main-price">
                <div className={`price-value ${priceChange >= 0 ? 'green' : 'red'}`}>
                  {livePrice.toFixed(2)}
                </div>
              </div>
              <div className="price-stats">
                <div className="stat-item">
                  <span className="stat-label">high</span>
                  <span className="stat-value">{highPrice.toFixed(2)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">low</span>
                  <span className="stat-value">{lowPrice.toFixed(2)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">24H</span>
                  <span className="stat-value">{volume24h.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="timeframe-selector">
              <button className="timeframe-btn" style={{ pointerEvents: 'none' }}>Time</button>
              <button className={`timeframe-btn ${chartInterval === '1' ? 'active' : ''}`} onClick={() => setChartInterval('1')}>1min</button>
              <button className={`timeframe-btn ${chartInterval === '5' ? 'active' : ''}`} onClick={() => setChartInterval('5')}>5min</button>
              <button className={`timeframe-btn ${chartInterval === '30' ? 'active' : ''}`} onClick={() => setChartInterval('30')}>30min</button>
              <button className={`timeframe-btn ${chartInterval === '60' ? 'active' : ''}`} onClick={() => setChartInterval('60')}>1hour</button>
              <button className={`timeframe-btn ${chartInterval === '1D' ? 'active' : ''}`} onClick={() => setChartInterval('1D')}>1day</button>
            </div>

            {/* Chart Section */}
            <div className="trade-chart-section">
              <TradingChart
                coinId={coinMeta.id}
                interval={chartInterval}
                onPrice={(price) => setLivePrice(price)}
                onTickerData={(stats) => setTickerStats(stats)}
                onChangeCoin={(id) => {
                  setCoinMeta({
                    id,
                    symbol: map[id].symbol,
                    name: map[id].name,
                  });
                }}
              />
            </div>

            {/* Trade Inputs Section */}
            <div className="trade-inputs-section">
              <div className="input-group">
                <label>Amount (USDT)</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTradeAmount(val === "" ? "" : Number(val));
                  }}
                  className="trade-input-field"
                  min="1"
                  placeholder="0"
                />
              </div>

              <div className="trade-durations-grid">
                {tradeDurations.map((option) => (
                  <button
                    key={option.seconds}
                    className={`duration-btn ${selectedDuration === option.seconds ? 'active' : ''}`}
                    onClick={() => setSelectedDuration(option.seconds)}
                  >
                    <div className="duration-time">{option.seconds} second</div>
                    <div className="duration-profit">{option.profitRate}%</div>
                  </button>
                ))}
              </div>

              {/* Transaction Mode Label */}
              <div className="transaction-mode-label">
                Transaction mode {isDemo && <span className="demo-mode-inline-indicator">(Practice)</span>}
              </div>

              {/* Buy/Sell Buttons */}
              <div className="trade-action-buttons">
                <button className="trade-action-btn buy-btn" onClick={() => handleTradeStart('up')}>
                  BUY / UP {isDemo ? '(DEMO)' : ''}
                </button>
                <button className="trade-action-btn sell-btn" onClick={() => handleTradeStart('down')}>
                  SELL / DOWN {isDemo ? '(DEMO)' : ''}
                </button>
              </div>

              {/* Positions / History */}
              <div className="trade-history-section" style={{ marginTop: '20px' }}>
                <Positions currentPrice={livePrice} currentCoin={coinMeta.symbol} isDemo={isDemo} />
              </div>
            </div>
          </>
        ) : (
          /* ================= PERPETUAL MODE UI (New) ================= */
          <div className="perpetual-mode-container">

            {/* Split Layout: Left Form | Right OrderBook */}
            <div style={{ display: 'flex', gap: '15px' }}>

              {/* LEFT SIDE: Trading Form */}
              <div style={{ flex: '1.4' }}>
                {/* 1. Side Selector (Buy/Sell) */}
                <div className="side-selector">
                  <div
                    className={`side-tab buy ${perpSide === 'buy' ? 'active' : ''}`}
                    onClick={() => setPerpSide('buy')}
                  >
                    Buy
                  </div>
                  <div
                    className={`side-tab sell ${perpSide === 'sell' ? 'active' : ''}`}
                    onClick={() => setPerpSide('sell')}
                  >
                    Sell
                  </div>
                </div>

                {/* 2. Order Form */}
                <div className="perp-form-group">
                  {/* Row 1: Order Type & Count */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="perp-input-container" style={{ flex: 1.5 }}>
                      <select className="order-type-select">
                        <option>market price</option>
                        <option>limit price</option>
                      </select>
                    </div>
                    <div className="perp-input-container" style={{ flex: 1 }}>
                      <select className="order-type-select">
                        <option>1</option>
                        <option>2</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="perp-form-group">
                  <div className="perp-input-container" style={{ padding: '12px' }}>
                    <span style={{ color: '#848e9c', fontSize: '13px' }}>Trade at the current best price</span>
                  </div>
                </div>

                {/* Unit Label */}
                <div style={{ color: '#848e9c', fontSize: '12px', margin: '10px 0 5px' }}>1.00 {coinMeta.symbol}</div>

                <div className="perp-form-group">
                  <label className="perp-label">Margin (USDT)</label>
                  <div className="perp-input-container">
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTradeAmount(val === "" ? "" : Number(val));
                      }}
                      className="perp-input"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Percentage Grid */}
                <div className="percentage-grid">
                  {[25, 50, 75, 100].map(percent => (
                    <button
                      key={percent}
                      className="percent-btn"
                      onClick={() => handlePerpPercentage(percent)}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>

                {/* Balance */}
                <div className={`perp-balance ${isDemo ? 'demo-balance-row' : ''}`} style={{ marginTop: '10px' }}>
                  <span>{isDemo ? 'Demo Balance' : 'Balance'}: {effectiveBalance.toFixed(2)} USDT</span>
                  {isDemo && (
                    <button
                      type="button"
                      className="reset-demo-inline-btn-perp"
                      onClick={handleResetDemo}
                      disabled={isResetting}
                    >
                      {isResetting ? "..." : "🔄 Reset"}
                    </button>
                  )}
                </div>

                {/* Leverage Selector */}
                <div className="perp-form-group" style={{ marginTop: '10px' }}>
                  <label className="perp-label">Leverage</label>
                  <select
                    className="order-type-select"
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                  >
                    {[1, 5, 10, 20, 50, 100].map(L => (
                      <option key={L} value={L}>{L}x</option>
                    ))}
                  </select>
                </div>

                {/* Action Button */}
                <button
                  className={`perp-action-btn ${perpSide}`}
                  onClick={() => handleTradeStart(perpSide === 'buy' ? 'up' : 'down')}
                  style={{ marginTop: '16px' }}
                >
                  {isDemo ? `[DEMO] ` : ''}{perpSide === 'buy' ? 'Buy (go long)' : 'Sell (go short)'}
                </button>
              </div>

              {/* RIGHT SIDE: Order Book */}
              <div style={{ flex: '1', borderLeft: '1px solid #1e293b', paddingLeft: '10px' }}>
                <OrderBook currentPrice={livePrice} />
              </div>
            </div>

            {/* Bottom Tabs: Current delegate / History */}
            <div className="bottom-tabs" style={{ marginTop: '30px' }}>
              <div
                className={`bottom-tab ${perpTab === 'positions' ? 'active' : ''}`}
                onClick={() => setPerpTab('positions')}
              >
                <span style={{ marginRight: '5px' }}>📄</span>
                Current delegate {isDemo && '(Demo)'}
              </div>
              <div
                className={`bottom-tab ${perpTab === 'history' ? 'active' : ''}`}
                onClick={() => setPerpTab('history')}
              >
                <span style={{ marginRight: '5px' }}>📄</span>
                History {isDemo && '(Demo)'}
              </div>
            </div>

            {/* Content for Bottom Tabs */}
            <div className="tab-content-area">
              {perpTab === 'positions' ? (
                /* Active Positions */
                <Positions currentPrice={livePrice} currentCoin={coinMeta.symbol} initialTab="active" variant="perpetual" isDemo={isDemo} />
              ) : (
                /* Completed History */
                <Positions currentPrice={livePrice} currentCoin={coinMeta.symbol} initialTab="completed" variant="perpetual" isDemo={isDemo} />
              )}
            </div>

          </div>
        )}
      </div>

      {/* INVISIBLE CHART LOADER FOR PERP MODE TO KEEP PRICE UPDATING? 
           Actually, TradingChart updates the price via onPrice callback. 
           If we unmount TradingChart in Perp mode, livePrice stops updating!
           We must keep TradingChart mounted but hidden if we want prices, 
           OR rely on it being visible if the design allows. 
           
           The reference image SHOWS the price "4330.39" but NO CHART in the layout.
           So we should hide the chart visually but keep it mounted.
       */}
      {contractType === 'perpetual' && (
        <div style={{ display: 'none' }}>
          <TradingChart
            coinId={coinMeta.id}
            interval={chartInterval}
            onPrice={(price) => setLivePrice(price)}
            onTickerData={(stats) => setTickerStats(stats)}
            onChangeCoin={(id) => {
              setCoinMeta({
                id,
                symbol: map[id].symbol,
                name: map[id].name,
              });
            }}
          />
        </div>
      )}


      {/* ACTIVE TRADE MODAL (For Delivery) */}
      {activeTrade && contractType === 'delivery' && (
        <ActiveTradeModal
          trade={activeTrade}
          currentPrice={livePrice}
          onClose={handleTradeClose}
        />
      )}

      {/* AUTH PROMPT MODAL FOR GUESTS SWITCHING TO REAL */}
      {authPromptModal && (
        <div className="alert-modal-backdrop" onClick={() => setAuthPromptModal(false)}>
          <div className="alert-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="alert-modal-icon" style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "var(--text-main, #08162b)" }}>Account Required</h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--text-muted, #64748b)", lineHeight: 1.5 }}>
              You are currently trading in guest practice mode. To trade with real funds and deposit crypto or fiat, please sign in or create your free account.
            </p>
            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <Link
                to="/signup"
                className="btn-hero-primary"
                style={{ flex: 1, justifyContent: "center", textDecoration: "none", padding: "10px 14px", borderRadius: 8 }}
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="btn-hero-secondary"
                style={{ flex: 1, justifyContent: "center", textDecoration: "none", padding: "10px 14px", borderRadius: 8, textAlign: "center" }}
              >
                Log In
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setAuthPromptModal(false)}
              style={{ marginTop: 12, background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}
            >
              Continue with Demo Mode
            </button>
          </div>
        </div>
      )}

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type="error"
        onClose={() => setAlertModal({ isOpen: false, message: '' })}
      />

      {/* Coin Selection Sidebar Drawer */}
      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Markets</h3>
              <span className="close-drawer" onClick={() => setIsDrawerOpen(false)}>✕</span>
            </div>
            <div className="drawer-list">
              {Object.entries(map).map(([id, coin]) => (
                <div
                  key={id}
                  className={`drawer-item ${coinMeta.id === id ? 'active' : ''}`}
                  onClick={() => {
                    setCoinMeta({ id, ...coin });
                    setIsDrawerOpen(false);
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: 'inherit' }}>{coin.symbol}/USDT</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{coin.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { openTrade, checkAndAutoCloseTrades } from "../services/tradeService";
import { getCryptoPrices } from "../services/priceService";
import TradingChart from "../components/TradingChart";
import ActiveTradeModal from "../components/ActiveTradeModal";
import AlertModal from "../components/AlertModal";
import Positions from "../components/Positions";
import coinList from "../data/coinList";
import "./TradeBinary.css";
import "./TradePerpetual.css";

import { onSnapshot, doc, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";

export default function Trade() {
  const { user } = useAuth();
  const [tradingBalance, setTradingBalance] = useState(0);
  const [coinMeta, setCoinMeta] = useState({
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
  });

  const [contractType, setContractType] = useState("delivery"); // delivery (binary) | perpetual
  const [livePrice, setLivePrice] = useState(0);
  const [highPrice, setHighPrice] = useState(0);
  const [lowPrice, setLowPrice] = useState(0);
  const [volume24h, setVolume24h] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTrade, setActiveTrade] = useState(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
  const [selectedDuration, setSelectedDuration] = useState(60); // seconds
  const [leverage, setLeverage] = useState(1);
  const [tradeAmount, setTradeAmount] = useState(10);
  const [fundingRate, setFundingRate] = useState(0.01);
  const [activeTrades, setActiveTrades] = useState([]);

  // Perpetual Specific State
  const [perpSide, setPerpSide] = useState('buy'); // 'buy' or 'sell'
  const [perpTab, setPerpTab] = useState('positions'); // 'positions' | 'history'

  const map = coinList;

  // Subscribe to trading balance and active trades
  useEffect(() => {
    if (!user) return;
    const unsubWallet = onSnapshot(doc(db, "wallets", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTradingBalance(data.tradingBalance !== undefined ? data.tradingBalance : 0);
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

  // Heartbeat monitoring for liquidation and expiration
  useEffect(() => {
    if (!user || activeTrades.length === 0) return;

    const heartbeat = setInterval(async () => {
      try {
        const prices = await getCryptoPrices();

        // Only run if there's someone to check
        if (activeTrades.length > 0) {
          await checkAndAutoCloseTrades(user.uid, activeTrades, prices);
        }
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(heartbeat);
  }, [user, activeTrades]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      let tradeDetails;

      if (contractType === 'delivery') {
        const duration = selectedDuration;
        const durationOption = tradeDurations.find(d => d.seconds === duration);
        tradeDetails = {
          type: 'delivery',
          coin: coinMeta,
          entryPrice: livePrice,
          amount: tradeAmount,
          side: direction === 'up' ? 'buy' : 'sell',
          duration: duration + 's',
          profitPercent: durationOption.profitRate,
        };
      } else {
        // Perpetual Logic
        // Unlike delivery which passes explicit direction argument, perp uses the state `perpSide`
        const side = perpSide;

        if (tradeAmount <= 0) {
          throw new Error("Amount must be greater than 0");
        }
        if (tradeAmount > tradingBalance) {
          throw new Error("Insufficient balance");
        }

        tradeDetails = {
          type: 'perpetual',
          coin: coinMeta,
          entryPrice: livePrice,
          amount: tradeAmount,
          side: side,
          leverage: leverage,
        };
      }

      const result = await openTrade(user.uid, tradeDetails);

      if (contractType === 'delivery') {
        setActiveTrade({
          ...tradeDetails,
          tradeId: result.tradeId,
          startTime: new Date(),
        });
      } else {
        setAlertModal({
          isOpen: true,
          message: `Successfully opened ${tradeDetails.side.toUpperCase()} position!`
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
    const amount = (tradingBalance * (percent / 100)).toFixed(2);
    setTradeAmount(parseFloat(amount));
  };

  const handleTradeClose = () => {
    setActiveTrade(null);
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = formatTime(date);
    return `${year}-${month}-${day} ${time}`;
  };

  return (
    <div className="trade-page binary-options-style">
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
            {/* Hamburger menu icon shim */}
            <span style={{ fontSize: '20px', marginRight: '5px' }}>≡</span>
            <span className="pair-name">{coinMeta.symbol} / USDT</span>
            <span className={`pair-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
            <span style={{ marginLeft: 'auto' }}>📊</span>
          </div>
        </div>

        {/* Dynamic Content based on Contract Type */}
        {contractType === 'delivery' ? (
          /* ================= DELIVERY MODE UI (Existing) ================= */
          <>
            <div className="trading-balance-chip">
              Balance: ${tradingBalance.toLocaleString()}
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
              <button className="timeframe-btn">Time</button>
              <button className="timeframe-btn active">1min</button>
              <button className="timeframe-btn">5min</button>
              <button className="timeframe-btn">30min</button>
              <button className="timeframe-btn">1hour</button>
              <button className="timeframe-btn">1day</button>
            </div>

            {/* Chart Section */}
            <div className="trade-chart-section">
              <TradingChart
                coinId={coinMeta.id}
                onPrice={(price) => setLivePrice(price)}
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
                  onChange={(e) => setTradeAmount(Number(e.target.value))}
                  className="trade-input-field"
                  min="1"
                />
              </div>

              <div className="trade-durations-grid">
                {tradeDurations.map((option) => (
                  <button
                    key={option.seconds}
                    className={`duration-btn ${selectedDuration === option.seconds ? 'active' : ''}`}
                    onClick={() => setSelectedDuration(option.seconds)}
                  >
                    <div className="duration-time">{option.seconds}s</div>
                    <div className="duration-profit">{option.profitRate}%</div>
                  </button>
                ))}
              </div>

              {/* Transaction Mode Label */}
              <div className="transaction-mode-label">Transaction mode</div>

              {/* Buy/Sell Buttons */}
              <div className="trade-action-buttons">
                <button className="trade-action-btn buy-btn" onClick={() => handleTradeStart('up')}>
                  BUY / UP
                </button>
                <button className="trade-action-btn sell-btn" onClick={() => handleTradeStart('down')}>
                  SELL / DOWN
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ================= PERPETUAL MODE UI (New) ================= */
          <div className="perpetual-mode-container">

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
              {/* Row 1: Order Type & Count? (Mocking the UI layout) */}
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

            <div style={{ margin: '10px 0', fontSize: '24px', fontWeight: '700', color: '#f8fafc', textAlign: 'center' }}>
              {livePrice.toFixed(2)}
            </div>

            <div className="perp-form-group">
              <label className="perp-label">Trading lots / Amount (USDT)</label>
              <div className="perp-input-container">
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(Number(e.target.value))}
                  className="perp-input"
                  placeholder="Enter amount"
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

            {/* Balance & Leverage */}
            <div className="perp-balance">
              <span>Balance: {tradingBalance.toFixed(4)} USDT</span>
              {/* Reuse existing leverage selector style but minimize it or put it in a modal? 
                        For now, simple button for leverage 
                    */}
            </div>
            <div className="leverage-selector-container">
              <label>Leverage: {leverage}x</label>
              <div className="leverage-grid">
                {[1, 10, 20, 50, 100].map((val) => (
                  <button
                    key={val}
                    className={`lev-btn ${leverage === val ? 'active' : ''}`}
                    onClick={() => setLeverage(val)}
                  >
                    {val}x
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              className={`perp-action-btn ${perpSide}`}
              onClick={() => handleTradeStart(perpSide === 'buy' ? 'up' : 'down')}
              style={{ marginTop: '16px' }}
            >
              {perpSide === 'buy' ? 'Buy (go long)' : 'Sell (go short)'}
            </button>

            {/* Bottom Tabs: Current delegate / History */}
            <div className="bottom-tabs">
              <div
                className={`bottom-tab ${perpTab === 'positions' ? 'active' : ''}`}
                onClick={() => setPerpTab('positions')}
              >
                <span style={{ marginRight: '5px' }}>📄</span>
                hold position
              </div>
              <div
                className={`bottom-tab ${perpTab === 'history' ? 'active' : ''}`}
                onClick={() => setPerpTab('history')}
              >
                <span style={{ marginRight: '5px' }}>📄</span>
                History
              </div>
            </div>

            {/* Content for Bottom Tabs */}
            <div className="tab-content-area">
              {perpTab === 'positions' ? (
                /* Re-using Positions component but we might need to style it differently or pass a 'variant' prop */
                <Positions currentPrice={livePrice} currentCoin={coinMeta.symbol} variant="perpetual" />
              ) : (
                <div className="empty-record">
                  <div className="empty-icon">📅</div>
                  <span>No record yet</span>
                </div>
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
            onPrice={(price) => setLivePrice(price)}
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

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type="error"
        onClose={() => setAlertModal({ isOpen: false, message: '' })}
      />
    </div>
  );
}


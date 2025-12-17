import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { openTrade } from "../services/tradeService";
import TradingChart from "../components/TradingChart";
import ActiveTradeModal from "../components/ActiveTradeModal";
import AlertModal from "../components/AlertModal";
import Positions from "../components/Positions";
import coinList from "../data/coinList";
import "./TradeBinary.css";

export default function Trade() {
  const { user } = useAuth();
  const [coinMeta, setCoinMeta] = useState({
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
  });

  const [contractType, setContractType] = useState("delivery"); // delivery | perpetual
  const [livePrice, setLivePrice] = useState(0);
  const [highPrice, setHighPrice] = useState(0);
  const [lowPrice, setLowPrice] = useState(0);
  const [volume24h, setVolume24h] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTrade, setActiveTrade] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState("trade"); // trade | positions
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
  const [selectedDuration, setSelectedDuration] = useState(60); // seconds

  const map = coinList;

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
      const duration = selectedDuration;
      const durationOption = tradeDurations.find(d => d.seconds === duration);

      const tradeDetails = {
        coin: coinMeta.symbol,
        entryPrice: livePrice,
        amount: 100, // You can make this customizable
        direction: direction, // 'up' or 'down'
        duration: duration,
        profitRate: durationOption.profitRate,
        contractType: contractType,
      };

      const result = await openTrade(user.uid, tradeDetails);

      setActiveTrade({
        ...tradeDetails,
        tradeId: result.tradeId,
        startTime: new Date(),
      });
    } catch (error) {
      console.error("Error opening trade:", error);
      setAlertModal({
        isOpen: true,
        message: error.message || "Failed to open trade. Please check your balance."
      });
    }
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
      {/* Pair Display */}
      <div className="pair-display">
        <div className="pair-info">
          <span className="pair-name">{coinMeta.symbol} / USDT</span>
          <span className={`pair-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Price Display */}
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
        <button className="timeframe-btn">1week</button>
        <button className="timeframe-btn">1mon</button>
      </div>

      {/* Chart Section (existing chart component) */}
      <div className="trade-chart-section">
        <TradingChart
          coinId={coinMeta.id}
          onPrice={(price) => {
            setLivePrice(price);
            // You can add logic to update high/low/volume
          }}
          onChangeCoin={(id) => {
            setCoinMeta({
              id,
              symbol: map[id].symbol,
              name: map[id].name,
            });
          }}
        />
      </div>

      {/* Timestamp with OHLC */}
      <div className="ohlc-display">
        <span className="timeframe">(1Min)</span>
        <span className="timestamp">{formatDateTime(currentTime)}</span>
        <span className="ohlc-data">
          O:{livePrice.toFixed(4)} H:{livePrice.toFixed(4)}
        </span>
      </div>

      {/* Trade Durations Grid */}
      <div className="trade-durations-grid">
        {tradeDurations.map((option) => (
          <button
            key={option.seconds}
            className={`duration-btn ${selectedDuration === option.seconds ? 'active' : ''}`}
            onClick={() => setSelectedDuration(option.seconds)}
          >
            <div className="duration-time">{option.seconds} second</div>
            <div className="duration-profit">profit rate{option.profitRate}%</div>
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

      {/* ACTIVE TRADE MODAL */}
      {activeTrade && (
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

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { openTrade } from "../services/tradeService";
import TradingChart from "../components/TradingChart";
import OrderPanel from "../components/OrderPanel";
import ActiveTradeModal from "../components/ActiveTradeModal";
import Positions from "../components/Positions";
import coinList from "../data/coinList";
import "./Trade.css";

export default function Trade() {
  const { user } = useAuth();
  const [coinMeta, setCoinMeta] = useState({
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
  });

  const [livePrice, setLivePrice] = useState(0);
  const [activeTrade, setActiveTrade] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState("trade"); // trade | positions

  const map = coinList;

  const handleTradeStart = async (tradeDetails) => {
    try {
      // Open trade and deduct balance
      const result = await openTrade(user.uid, tradeDetails);

      // Add trade ID to details
      setActiveTrade({
        ...tradeDetails,
        tradeId: result.tradeId
      });
    } catch (error) {
      console.error("Error opening trade:", error);
      alert(error.message || "Failed to open trade. Please check your balance.");
    }
  };

  const handleTradeClose = () => {
    setActiveTrade(null);
  };

  return (
    <div className="trade-page">
      <div className="trade-header">
        <h1 style={{ marginBottom: "10px" }}>
          {coinMeta.name}{" "}
          <span style={{ color: "#aaa" }}>{coinMeta.symbol} / USD</span>
        </h1>
      </div>

      {/* VERTICAL LAYOUT */}
      <div className="trade-container">

        {/* TOP — TRADING CHART */}
        <div className="trade-chart-section">
          <TradingChart
            coinId={coinMeta.id}
            onPrice={setLivePrice}
            onChangeCoin={(id) => {
              setCoinMeta({
                id,
                symbol: map[id].symbol,
                name: map[id].name,
              });
            }}
          />
        </div>

        {/* MIDDLE — TABS */}
        <div className="trade-tabs-bar">
          <button
            className={`main-tab ${activeMainTab === "trade" ? "active" : ""}`}
            onClick={() => setActiveMainTab("trade")}
          >
            Trade
          </button>
          <button
            className={`main-tab ${activeMainTab === "positions" ? "active" : ""}`}
            onClick={() => setActiveMainTab("positions")}
          >
            Positions
          </button>
        </div>

        {/* BOTTOM — CONTENT */}
        <div className="trade-bottom-section">
          {activeMainTab === "trade" ? (
            <div className="trade-order-section">
              <div className="quick-trade-header">
                <h3>Quick Trade</h3>
                <span className="spread-info">Spread: 200.0 pips</span>
              </div>
              <OrderPanel
                coin={{
                  id: coinMeta.id,
                  symbol: coinMeta.symbol,
                  name: coinMeta.name,
                }}
                livePrice={livePrice}
                onTrade={handleTradeStart}
              />
            </div>
          ) : (
            <div className="trade-positions-section">
              <Positions />
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE TRADE MODAL */}
      {activeTrade && (
        <ActiveTradeModal
          trade={activeTrade}
          currentPrice={livePrice}
          onClose={handleTradeClose}
        />
      )}
    </div>
  );
}

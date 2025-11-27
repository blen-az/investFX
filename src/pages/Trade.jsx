import React, { useState } from "react";
import TradingChart from "../components/TradingChart";
import OrderPanel from "../components/OrderPanel";
import coinList from "../data/coinList";
import "./Trade.css";

export default function Trade() {
  const [coinMeta, setCoinMeta] = useState({
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
  });

  const [livePrice, setLivePrice] = useState(0);

  const map = coinList;

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

        {/* BOTTOM — QUICK TRADE */}
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
          />
        </div>
      </div>
    </div>
  );
}

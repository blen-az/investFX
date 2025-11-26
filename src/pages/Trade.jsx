import React, { useState } from "react";
import TradingChart from "../components/TradingChart";
import OrderPanel from "../components/OrderPanel";
import coinList from "../data/coinList";

export default function Trade() {
  const [coinMeta, setCoinMeta] = useState({
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
  });

  const [livePrice, setLivePrice] = useState(0);

  const map = coinList;

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "10px" }}>
        {coinMeta.name}{" "}
        <span style={{ color: "#aaa" }}>{coinMeta.symbol} / USD</span>
      </h1>

      {/* GRID LAYOUT */}
      <div className="trade-grid" style={{ marginTop: 18 }}>
        
        {/* LEFT — TRADING CHART */}
        <div className="trade-chart-column">
          <div className="card trade-chart-card">
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
        </div>

        {/* RIGHT — ORDER PANEL */}
        <div className="trade-order-column">
          <div className="card trade-order-card">
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
    </div>
  );
}

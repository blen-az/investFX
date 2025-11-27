import React, { useEffect, useRef, useState } from "react";

const COINS = [
  { id: "bitcoin", label: "BTC / USD" },
  { id: "ethereum", label: "ETH / USD" },
  { id: "solana", label: "SOL / USD" },
  { id: "dogecoin", label: "DOGE / USD" },
];

let tvScriptLoadingPromise = null;

export default function TradingChart({ coinId, onPrice, onChangeCoin }) {
  const containerRef = useRef();
  const tvWidgetRef = useRef(null);
  const [selectedCoin, setSelectedCoin] = useState(coinId);

  const toTVSymbol = (id) => {
    switch (id) {
      case "bitcoin": return "BINANCE:BTCUSDT";
      case "ethereum": return "BINANCE:ETHUSDT";
      case "solana": return "BINANCE:SOLUSDT";
      case "dogecoin": return "BINANCE:DOGEUSDT";
      default: return "BINANCE:BTCUSDT";
    }
  };

  function loadTVScript() {
    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.onload = resolve;
        document.body.appendChild(script);
      });
    }
    return tvScriptLoadingPromise;
  }

  function createWidget(symbol) {
    if (!window.TradingView) return;

    tvWidgetRef.current = new window.TradingView.widget({
      symbol,
      interval: "60",
      autosize: true,
      theme: "dark",
      style: "1",
      locale: "en",
      timezone: "Etc/UTC",
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      container_id: "tv_chart_container",
    });
  }

  useEffect(() => {
    loadTVScript().then(() => {
      if (tvWidgetRef.current) tvWidgetRef.current.remove();
      createWidget(toTVSymbol(selectedCoin));
    });

    return () => {
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
      }
    };
  }, [selectedCoin]);

  useEffect(() => {
    const streams = {
      bitcoin: "btcusdt",
      ethereum: "ethusdt",
      solana: "solusdt",
      dogecoin: "dogeusdt",
    };

    const ws = new WebSocket(
      "wss://stream.binance.com:9443/ws/" + streams[selectedCoin] + "@ticker"
    );

    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d?.c) onPrice(parseFloat(d.c));
    };

    return () => ws.close();
  }, [selectedCoin]);

  useEffect(() => {
    if (coinId !== selectedCoin) setSelectedCoin(coinId);
  }, [coinId]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] rounded-lg overflow-hidden">

      <div className="flex gap-2 px-3 py-2 border-b border-gray-800">
        {COINS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedCoin(c.id);
              onChangeCoin?.(c.id);
            }}
            className={`px-3 py-1 rounded text-sm font-semibold ${selectedCoin === c.id
                ? "bg-yellow-500 text-black"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Container MUST have an id */}
      <div
        id="tv_chart_container"
        ref={containerRef}
        className="flex-1 w-full"
        style={{ minHeight: '650px', height: '650px' }}
      />
    </div>
  );
}

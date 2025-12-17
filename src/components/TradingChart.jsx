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
      allow_symbol_change: true,
      save_image: false,
      container_id: "tv_chart_container",
      width: "100%",
      height: "100%",
    });
  }

  useEffect(() => {
    loadTVScript().then(() => {
      if (tvWidgetRef.current) {
        try {
          tvWidgetRef.current.remove();
        } catch (e) {
          // Widget already removed or DOM not available
          console.warn("Chart cleanup warning:", e);
        }
      }
      createWidget(toTVSymbol(selectedCoin));
    });

    return () => {
      if (tvWidgetRef.current) {
        try {
          tvWidgetRef.current.remove();
        } catch (e) {
          // Safely ignore if widget is already cleaned up
          console.warn("Chart cleanup warning:", e);
        }
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

    const coinIds = {
      bitcoin: "bitcoin",
      ethereum: "ethereum",
      solana: "solana",
      dogecoin: "dogecoin",
    };

    // Fallback: Fetch price from API if WebSocket doesn't connect quickly
    const fetchPriceFallback = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds[selectedCoin]}&vs_currencies=usd`
        );
        const data = await response.json();
        const price = data[coinIds[selectedCoin]]?.usd;
        if (price) {
          onPrice(price);
        }
      } catch (error) {
        console.error("Error fetching fallback price:", error);
      }
    };

    // Try WebSocket first
    const ws = new WebSocket(
      "wss://stream.binance.com:9443/ws/" + streams[selectedCoin] + "@ticker"
    );

    let priceReceived = false;

    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d?.c) {
        priceReceived = true;
        onPrice(parseFloat(d.c));
      }
    };

    ws.onerror = () => {
      console.log("WebSocket error, using fallback API");
      fetchPriceFallback();
    };

    // If no price after 3 seconds, use fallback
    const fallbackTimer = setTimeout(() => {
      if (!priceReceived) {
        console.log("WebSocket slow, using fallback API");
        fetchPriceFallback();
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      ws.close();
    };
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
      />
    </div>
  );
}

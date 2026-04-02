import React, { useEffect, useRef, useState } from "react";

const COINS = [
  { id: "bitcoin", label: "BTC / USD" },
  { id: "ethereum", label: "ETH / USD" },
  { id: "solana", label: "SOL / USD" },
  { id: "binancecoin", label: "BNB / USD" },
  { id: "ripple", label: "XRP / USD" },
  { id: "cardano", label: "ADA / USD" },
  { id: "dogecoin", label: "DOGE / USD" },
  { id: "polkadot", label: "DOT / USD" },
  { id: "litecoin", label: "LTC / USD" },
  { id: "chainlink", label: "LINK / USD" },
];

let tvScriptLoadingPromise = null;

export default function TradingChart({ coinId, interval = "60", onPrice, onTickerData, onChangeCoin }) {
  const containerRef = useRef();
  const tvWidgetRef = useRef(null);
  const [selectedCoin, setSelectedCoin] = useState(coinId);

  const toTVSymbol = (id) => {
    switch (id) {
      case "bitcoin": return "BINANCE:BTCUSDT";
      case "ethereum": return "BINANCE:ETHUSDT";
      case "solana": return "BINANCE:SOLUSDT";
      case "binancecoin": return "BINANCE:BNBUSDT";
      case "ripple": return "BINANCE:XRPUSDT";
      case "cardano": return "BINANCE:ADAUSDT";
      case "dogecoin": return "BINANCE:DOGEUSDT";
      case "polkadot": return "BINANCE:DOTUSDT";
      case "litecoin": return "BINANCE:LTCUSDT";
      case "chainlink": return "BINANCE:LINKUSDT";
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

  function createWidget(symbol, currentInterval) {
    if (!window.TradingView) return;

    tvWidgetRef.current = new window.TradingView.widget({
      symbol,
      interval: currentInterval,
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
      createWidget(toTVSymbol(selectedCoin), interval);
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
  }, [selectedCoin, interval]);

  const onPriceRef = useRef(onPrice);
  const onTickerDataRef = useRef(onTickerData);
  useEffect(() => {
    onPriceRef.current = onPrice;
    onTickerDataRef.current = onTickerData;
  }, [onPrice, onTickerData]);

  useEffect(() => {
    const streams = {
      bitcoin: "btcusdt",
      ethereum: "ethusdt",
      solana: "solusdt",
      binancecoin: "bnbusdt",
      ripple: "xrpusdt",
      cardano: "adausdt",
      dogecoin: "dogeusdt",
      polkadot: "dotusdt",
      litecoin: "ltcusdt",
      chainlink: "linkusdt",
    };

    const coinIds = {
      bitcoin: "bitcoin",
      ethereum: "ethereum",
      solana: "solana",
      binancecoin: "binancecoin",
      ripple: "ripple",
      cardano: "cardano",
      dogecoin: "dogecoin",
      polkadot: "polkadot",
      litecoin: "litecoin",
      chainlink: "chainlink",
    };

    // Fallback: Fetch price from API if WebSocket doesn't connect quickly
    const fetchPriceFallback = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds[selectedCoin]}`
        );
        const data = await response.json();
        const coinData = data[0]; // markets endpoint returns an array
        if (coinData?.current_price) {
          onPriceRef.current(coinData.current_price);
          if (onTickerDataRef.current) {
            onTickerDataRef.current({
              price: coinData.current_price,
              high: coinData.high_24h || coinData.current_price,
              low: coinData.low_24h || coinData.current_price,
              volume: coinData.total_volume || 0,
              change: coinData.price_change_percentage_24h || 0
            });
          }
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
        onPriceRef.current(parseFloat(d.c));
        if (onTickerDataRef.current) {
          onTickerDataRef.current({
            price: parseFloat(d.c),
            high: parseFloat(d.h || d.c),
            low: parseFloat(d.l || d.c),
            volume: parseFloat(d.v || 0),
            change: parseFloat(d.P || 0)
          });
        }
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
  }, [coinId, selectedCoin]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] rounded-lg overflow-hidden relative">

      <div className="flex gap-2 px-3 py-2 border-b border-gray-800 overflow-x-auto scrollbar-hide flex-shrink-0 z-10 w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
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

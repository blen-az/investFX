// src/pages/Market.jsx
import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import MiniSpark from "../components/MiniSpark";
import { Search, Star, TrendingUp, TrendingDown, ChevronRight, RotateCcw } from "lucide-react";
import "./Market.css";

// Primary API (CoinGecko)
const MAIN_API = (page = 1, per = 12) =>
  `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${per}&page=${page}&sparkline=true&price_change_percentage=24h`;
// Backup API (CoinCap) - somewhat different shape, we convert
const BACKUP_API = (limit = 12, offset = 0) => `https://api.coincap.io/v2/assets?limit=${limit}&offset=${offset}`;

// placeholder image (data URI gray)
const FALLBACK_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%230b1220'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2398a6b3' font-size='10'>no-img</text></svg>";

// lazy-load TradingChart component (your existing component)
const TradingChartLazy = React.lazy(() => import("../components/TradingChart"));

export default function Market() {
  const navigate = useNavigate();

  // pagination
  const PER_PAGE = 12;
  const [page, setPage] = useState(1);

  // data & ui
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("marketcap"); // marketcap | gainers | losers | volume
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("watchlist_v1") || "[]");
    } catch {
      return [];
    }
  });

  // modal chart
  const [showChartFor, setShowChartFor] = useState(null);

  // XAU (Gold) live price
  const [xauPrice, setXauPrice] = useState(null);
  const [xauChange, setXauChange] = useState(0);

  useEffect(() => {
    async function fetchXauPrice() {
      try {
        const res = await fetch("https://api.exchangerate.host/convert?from=XAU&to=USD&amount=1");
        if (res.ok) {
          const data = await res.json();
          setXauPrice(data?.result || 2400);
        } else {
          setXauPrice(2400);
        }
      } catch {
        setXauPrice(2400);
      }
    }
    fetchXauPrice();
    const xauInterval = setInterval(fetchXauPrice, 30000);
    return () => clearInterval(xauInterval);
  }, []);

  // infinite scroll observer
  const sentinelRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);
  const isFetchingRef = useRef(false);

  // caching window/session
  const CACHE_KEY = "market_cache_v1";

  // ----- util: fetch with timeout -----
  async function fetchWithTimeout(url, ms = 8000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res;
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  }

  // ----- load page (tries main, falls back) -----
  async function loadPage(p = 1, per = PER_PAGE, useCache = true) {
    // avoid concurrent loads
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    // check brief cache for first page only
    if (useCache && p === 1) {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const obj = JSON.parse(raw);
          // if cached less than 8s ago, use it immediately
          if (Date.now() - (obj.ts || 0) < 8_000 && Array.isArray(obj.data)) {
            setCoins(obj.data);
            setLoading(false);
            // still fetch in background to refresh
            backgroundRefresh(p, per);
            isFetchingRef.current = false;
            return;
          }
        }
      } catch { }
    }

    try {
      // try main API quickly
      const res = await fetchWithTimeout(MAIN_API(p, per), 8000);
      const data = await res.json();
      if (Array.isArray(data) && data.length >= 0) {
        // If page==1 replace, else append
        setCoins((prev) => (p === 1 ? data : [...prev, ...data]));
        // cache first page
        if (p === 1) {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
        }
        setHasMore(data.length === per);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }
      throw new Error("Invalid main data");
    } catch (mainErr) {
      // fallback to CoinCap (convert)
      try {
        const offset = (p - 1) * per;
        const res2 = await fetchWithTimeout(BACKUP_API(per, offset), 8000);
        const json = await res2.json();
        if (json?.data && Array.isArray(json.data)) {
          const converted = json.data.map((a) => ({
            id: a.id,
            name: a.name,
            symbol: a.symbol,
            image: `https://assets.coincap.io/assets/icons/${a.symbol.toLowerCase()}@2x.png`,
            current_price: Number(a.priceUsd || a.price),
            price_change_percentage_24h: Number(a.changePercent24Hr || 0),
            sparkline_in_7d: { price: [] },
            total_volume: null,
          }));
          setCoins((prev) => (p === 1 ? converted : [...prev, ...converted]));
          setHasMore(converted.length === per);
          if (p === 1) sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: converted }));
          setLoading(false);
          isFetchingRef.current = false;
          return;
        }
        throw new Error("Backup invalid");
      } catch (backupErr) {
        console.error("Both APIs failed", mainErr, backupErr);
        // if first page and we had previously cached stale data, show it
        if (p === 1) {
          try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (raw) {
              const obj = JSON.parse(raw);
              if (Array.isArray(obj.data)) setCoins(obj.data);
            }
          } catch { }
        }
        setHasMore(false);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }
    }
  }

  // background refresh (don't block UI)
  function backgroundRefresh(p = 1, per = PER_PAGE) {
    fetchWithTimeout(MAIN_API(p, per), 3000)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          if (p === 1) {
            setCoins(data);
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
          }
        }
      })
      .catch(() => { });
  }

  // initial load & when page changes
  useEffect(() => {
    loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // auto infinite-scroll using IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !isFetchingRef.current) {
            setPage((p) => p + 1);
          }
        });
      },
      { root: null, rootMargin: "400px", threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  // watchlist toggle
  function toggleFavorite(id) {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      localStorage.setItem("watchlist_v1", JSON.stringify(next));
      return next;
    });
  }

  // search + sort derived
  const filtered = useMemo(() => {
    if (!coins || coins.length === 0) return [];
    const q = search.trim().toLowerCase();
    let arr = coins.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );

    switch (sort) {
      case "gainers":
        arr = arr.slice().sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
        break;
      case "losers":
        arr = arr.slice().sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0));
        break;
      case "volume":
        arr = arr.slice().sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
        break;
      default:
        // arr = arr (no-op, already sorted by market cap)
        break;
    }
    return arr;
  }, [coins, search, sort]);

  // open trade page with state
  function openTrade(coin) {
    navigate("/trade", { state: { coin } });
  }

  // image onError fallback
  function handleImgError(e) {
    if (e && e.target) e.target.src = FALLBACK_IMG;
  }

  return (
    <div className="market-page">

      {/* Page Header */}
      <div className="market-page-header anim-fade-up">
        <div>
          <h1 className="market-title">Market</h1>
          <p className="market-subtitle">Discover and track live crypto prices</p>
        </div>
      </div>

      {/* Search + Filter Row */}
      <div className="market-toolbar anim-fade-up delay-1">
        <div className="market-search-wrap">
          <Search size={16} className="market-search-icon" />
          <input
            className="market-search"
            placeholder="Search BTC, ETH, SOL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="wm-filter-tabs">
          {[
            { id: "marketcap", label: "Top" },
            { id: "gainers",   label: "Top Gainers" },
            { id: "losers",    label: "Top Losers" },
            { id: "volume",    label: "Volume" },
          ].map((b) => (
            <button
              key={b.id}
              className={`wm-filter-tab${sort === b.id ? " active" : ""}`}
              onClick={() => setSort(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coin List */}
      {loading && coins.length === 0 ? (
        <div className="market-list anim-fade-up delay-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="market-coin-row skeleton-row">
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton skeleton-text" style={{ width: 80 }} />
                <div className="skeleton skeleton-text" style={{ width: 55 }} />
              </div>
              <div className="skeleton" style={{ width: 80, height: 36, borderRadius: 8 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <div className="skeleton skeleton-text" style={{ width: 80 }} />
                <div className="skeleton skeleton-text" style={{ width: 55 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="market-list anim-fade-up delay-2">
            {/* XAU pinned row */}
            {sort === "marketcap" && (
              <div
                className="market-coin-row xau-row"
                onClick={() => navigate("/trade", { state: { coin: { id: 'gold', name: 'Gold', symbol: 'XAU' } } })}
              >
                <div className="market-coin-icon xau-icon">⚜</div>
                <div className="market-coin-meta">
                  <span className="market-coin-name">Gold</span>
                  <span className="market-coin-sym">XAU/USD</span>
                </div>
                <div className="market-sparkline" />
                <div className="market-coin-right">
                  <span className="market-coin-price">
                    {xauPrice
                      ? `$${Number(xauPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                  <span className="market-coin-tag">Commodity</span>
                </div>
                <ChevronRight size={16} className="market-row-arrow" />
              </div>
            )}

            {filtered.map((c) => {
              const isUp = c.price_change_percentage_24h >= 0;
              const pct = c.price_change_percentage_24h?.toFixed(2) ?? "0.00";
              const isFav = favorites.includes(c.id);
              return (
                <div key={c.id} className="market-coin-row">
                  <img
                    className="market-coin-img"
                    src={c.image || FALLBACK_IMG}
                    alt={c.name}
                    onError={handleImgError}
                  />
                  <div className="market-coin-meta">
                    <span className="market-coin-name">
                      {c.symbol?.toUpperCase()}
                      <button
                        className={`star-btn${isFav ? " starred" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(c.id); }}
                        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star size={11} fill={isFav ? "currentColor" : "none"} />
                      </button>
                    </span>
                    <span className="market-coin-sym">{c.name}</span>
                  </div>
                  <div className="market-sparkline">
                    <MiniSpark
                      prices={(c.sparkline_in_7d?.price || []).slice(-36)}
                      up={isUp}
                    />
                  </div>
                  <div className="market-coin-right">
                    <span className="market-coin-price">
                      ${Number(c.current_price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`market-coin-change${isUp ? " positive" : " negative"}`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(pct)}%
                    </span>
                  </div>
                  <button
                    className="market-trade-btn"
                    onClick={() => openTrade({ id: c.id, name: c.name, symbol: c.symbol })}
                  >
                    Trade
                  </button>
                </div>
              );
            })}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} style={{ height: 8 }} />

          {/* Status row */}
          <div className="market-status-row">
            {loading && coins.length > 0 && (
              <span className="market-status-text">Updating…</span>
            )}
            {!loading && hasMore && (
              <button className="btn-secondary" onClick={() => setPage(p => p + 1)}>
                Load more
              </button>
            )}
            {!hasMore && coins.length === 0 && (
              <div className="market-error">
                <p>Couldn't load market data. Rate limit or network issue.</p>
                <button className="btn-primary" onClick={() => loadPage(1, PER_PAGE, false)}>
                  <RotateCcw size={14} /> Retry
                </button>
              </div>
            )}
            {!hasMore && coins.length > 0 && (
              <span className="market-status-text">All {coins.length} assets loaded</span>
            )}
          </div>
        </>
      )}

      {/* TradingChart modal (lazy loaded) */}
      {showChartFor && (
        <div className="wm-overlay" onClick={() => setShowChartFor(null)}>
          <div
            className="glass-card"
            style={{ width: "90%", maxWidth: 960, margin: "60px auto", padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: "var(--wm-text)" }}>{showChartFor.toUpperCase()} / USD</span>
              <button className="btn-ghost" onClick={() => setShowChartFor(null)}>Close</button>
            </div>
            <div style={{ height: 360 }}>
              <Suspense fallback={<div style={{ color: "var(--wm-text-3)", padding: 20 }}>Loading chart…</div>}>
                <TradingChartLazy coinId={showChartFor} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

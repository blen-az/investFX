// src/pages/Market.jsx
import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import MiniSpark from "../components/MiniSpark";
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

  // infinite scroll observer
  const sentinelRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);
  const isFetchingRef = useRef(false);

  // caching window/session
  const CACHE_KEY = "market_cache_v1";

  // ----- util: fetch with timeout -----
  async function fetchWithTimeout(url, ms = 2000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
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
      const res = await fetchWithTimeout(MAIN_API(p, per), 2200);
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
        const res2 = await fetchWithTimeout(BACKUP_API(per, offset), 2200);
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
        arr = arr;
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
    <div className="page-wrap market-page">
      <div className="container">
        <div className="header market-header-row">
          <div>
            <h1 className="h1">Market</h1>
            <div className="sub">Live crypto prices — fast, professional</div>
          </div>

          <div className="market-filters">
            {[
              { id: "marketcap", label: "Top" },
              { id: "gainers", label: "Gainers" },
              { id: "losers", label: "Losers" },
              { id: "volume", label: "Volume" },
            ].map((b) => (
              <button key={b.id} className="btn" style={{ background: sort === b.id ? "var(--accent)" : "#122433" }} onClick={() => setSort(b.id)}>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <input
            placeholder="Search coin (BTC, ETH, etc)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ padding: 12, width: "100%", fontSize: 15 }}
          />
        </div>

        {/* skeleton + shimmer when first loading and no cached data */}
        {loading && coins.length === 0 ? (
          <div className="market-grid">
            {Array.from({ length: PER_PAGE }).map((_, i) => (
              <div key={i} className="card market-card">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: "#0f2030", animation: "shimmer 1.4s infinite" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: "55%", background: "#0f2030", borderRadius: 6, marginBottom: 6, animation: "shimmer 1.4s infinite" }} />
                    <div style={{ height: 12, width: "35%", background: "#0f2030", borderRadius: 6, animation: "shimmer 1.4s infinite" }} />
                  </div>
                </div>
                <div style={{ height: 32, width: "100%", marginTop: 10, background: "#0f2030", borderRadius: 6, animation: "shimmer 1.4s infinite" }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="market-grid">
              {filtered.map((c) => (
                <div key={c.id} className="card market-card">
                  {/* header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <img src={c.image || FALLBACK_IMG} alt={c.name} width="36" height="36" style={{ borderRadius: 8 }} onError={handleImgError} />
                      <div>
                        <Link to={`/coin/${c.id}`} style={{ color: "var(--accent)", fontWeight: 800, fontSize: 16, textDecoration: "none" }}>
                          {c.name}
                        </Link>
                        <div className="sub" style={{ fontSize: 12 }}>
                          {c.symbol?.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <button onClick={() => toggleFavorite(c.id)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, color: favorites.includes(c.id) ? "var(--accent)" : "var(--muted)" }}>
                      ★
                    </button>
                  </div>

                  {/* price + sparkline */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>${Number(c.current_price).toLocaleString()}</div>
                      <div style={{ fontSize: 13, color: c.price_change_percentage_24h >= 0 ? "var(--positive)" : "var(--negative)" }}>
                        {c.price_change_percentage_24h?.toFixed(2)}%
                      </div>
                    </div>

                    <div style={{ width: 120 }}>
                      <MiniSpark prices={(c.sparkline_in_7d?.price || []).slice(-36)} up={c.price_change_percentage_24h >= 0} />
                    </div>
                  </div>

                  {/* actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-buy" onClick={() => openTrade({ id: c.id, name: c.name, symbol: c.symbol })}>
                      Trade
                    </button>

                    <button className="btn" style={{ background: "#0d2235" }} onClick={() => setShowChartFor(c.id)}>
                      Chart
                    </button>

                    <Link to={`/coin/${c.id}`} className="btn" style={{ background: "#122433", textDecoration: "none" }}>
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* sentinel for infinite scroll */}
            <div ref={sentinelRef} style={{ height: 8 }} />

            {/* load more / status */}
            <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
              {loading && coins.length > 0 ? <div className="sub">Updating…</div> : null}
              {!loading && hasMore ? (
                <button
                  className="btn"
                  onClick={() => {
                    setPage((p) => p + 1);
                  }}
                >
                  Load more
                </button>
              ) : null}
              {!hasMore && <div className="sub">End of list</div>}
            </div>
          </>
        )}

        {/* Watchlist quick view */}
        {favorites.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800, color: "var(--accent)" }}>Watchlist</div>
                <div className="sub">Quick access</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto" }}>
                {favorites.map((id) => {
                  const coin = coins.find((c) => c.id === id);
                  if (!coin) return null;
                  return (
                    <div key={id} style={{ minWidth: 160, background: "#071426", padding: 8, borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <img src={coin.image || FALLBACK_IMG} alt="" width={28} onError={handleImgError} />
                          <div>
                            <div style={{ fontWeight: 700 }}>{coin.symbol?.toUpperCase()}</div>
                            <div className="sub" style={{ fontSize: 12 }}>
                              ${Number(coin.current_price).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => toggleFavorite(id)} className="btn" style={{ padding: 6 }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TradingChart modal (lazy loaded) */}
        {showChartFor && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20,
            }}
            onClick={() => setShowChartFor(null)}
          >
            <div style={{ width: "100%", maxWidth: 1000, background: "var(--panel)", borderRadius: 12, padding: 16 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 800, color: "var(--accent)" }}>{showChartFor}</div>
                <button className="btn" onClick={() => setShowChartFor(null)}>
                  Close
                </button>
              </div>

              <div style={{ height: 360 }}>
                <Suspense fallback={<div className="sub">Loading chart…</div>}>
                  {/* TradingChart expects prop coinId in earlier code */}
                  <TradingChartLazy coinId={showChartFor} />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        {/* styles for shimmer */}
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-8%); opacity: 0.6 }
            50% { transform: translateX(8%); opacity: 1 }
            100% { transform: translateX(-8%); opacity: 0.6 }
          }
        `}</style>
      </div>
    </div>
  );
}

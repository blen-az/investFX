// src/components/NewsWidget.jsx
import React, { useEffect, useState } from "react";

/**
 * NewsWidget (no API key required)
 * - Fetches CoinGecko status updates (public endpoint)
 * - Shows top 3 items (auto-refresh)
 * - Safe fallback if the API fails
 */

const COINGECKO_STATUS_URL =
  "https://api.coingecko.com/api/v3/status_updates?per_page=10";

export default function NewsWidget({ maxItems = 3, refreshMs = 60_000 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(COINGECKO_STATUS_URL);
      if (!res.ok) throw new Error("Failed fetching status");
      const json = await res.json();

      const list = Array.isArray(json.status_updates)
        ? json.status_updates
        : json;

      const mapped = (list || []).map((u) => ({
        id: u.id || u.project_id || Math.random().toString(36).slice(2, 9),
        title:
          u.title ||
          u.description?.slice(0, 80) ||
          (u.project && u.project.name) ||
          "Update",
        body: u.description || u.body || "",
        url: u.url || u.link || u.project?.website || null,
        source: u.project?.name || u.source_name || "CoinGecko",
        date: u.created_at || u.published_at || new Date().toISOString(),
      }));

      setItems(mapped.slice(0, maxItems));
    } catch (e) {
      console.error("NewsWidget load error:", e);
      setErr("Unable to load news right now.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, refreshMs);
    return () => clearInterval(iv);
  }, [maxItems, refreshMs]);

  return (
    <div className="card" style={{ padding: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 800, color: "var(--accent)" }}>
          Trending Crypto News
        </div>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          {loading ? "Refreshing…" : "Live"}
        </div>
      </div>

      {err && <div className="sub" style={{ color: "var(--negative)" }}>{err}</div>}

      {!loading && items.length === 0 && !err && (
        <div className="sub">No news available right now.</div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((it) => (
          <a
            key={it.id}
            href={it.url || "#"}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontWeight: 700, color: "var(--accent2)" }}>
                {it.title}
              </div>

              <div
                className="sub"
                style={{ fontSize: 13, color: "var(--muted)" }}
              >
                {it.body
                  ? it.body.length > 120
                    ? `${it.body.slice(0, 120)}…`
                    : it.body
                  : it.source}
              </div>

              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {new Date(it.date).toLocaleString()}
              </div>
            </div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={load}
          className="btn"
          style={{
            background: "#122433",
            color: "#fff",
            padding: "8px 10px",
            borderRadius: 8,
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
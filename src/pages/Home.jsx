// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import BottomNav from "../components/BottomNav";
import MarketCard from "../components/MarketCard";
import CryptoRow from "../components/CryptoRow";
import "./Home.css";

export default function Home() {
  const { user } = useAuth();
  const [trending, setTrending] = useState([]);
  const [news, setNews] = useState([]);
  const [top, setTop] = useState([]);
  const [balanceHidden, setBalanceHidden] = useState(true);

  const [balance] = useState(150000);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/search/trending")
      .then((r) => r.json())
      .then((d) => {
        if (d?.coins) setTrending(d.coins.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN")
      .then((r) => r.json())
      .then((d) => {
        if (d?.Data) setNews(d.Data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=10&page=1&order=market_cap_desc"
    )
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setTop(d.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="fx-home">

      {/* SEARCH BAR */}
      <section className="fx-search container">
        <input
          className="search-input"
          placeholder="Search crypto, transactions, or users..."
        />
      </section>

      {/* BALANCE CARD */}
      <section className="fx-balance container">
        <div className="balance-left">
          <div className="bal-title">Total Assets</div>
          <div className="bal-amount">
            {balanceHidden ? "******* **" : `$${Number(balance).toFixed(2)}`}
            <button
              className="eye-btn"
              title={balanceHidden ? "Show balance" : "Hide balance"}
              onClick={() => setBalanceHidden(!balanceHidden)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
          </div>

          <div className="bal-sub">-1.5% this week</div>
        </div>

        <div className="balance-right">
          <div className="mini-chart" />
          <Link to="/deposit" className="btn deposit">
            ➕ Deposit
          </Link>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="fx-quick container">
        <h3>Quick Actions</h3>
        <div className="qa-grid">
          <Link to="/transactions" className="qa-card">
            <div className="qa-ico">⏱</div>
            <div className="qa-title">Transactions</div>
          </Link>

          <Link to="/trade" className="qa-card">
            <div className="qa-ico">📈</div>
            <div className="qa-title">Trades</div>
          </Link>

          <Link to="/support" className="qa-card">
            <div className="qa-ico">🎧</div>
            <div className="qa-title">Support</div>
          </Link>

          <Link to="/chat" className="qa-card">
            <div className="qa-ico">💬</div>
            <div className="qa-title">Live Chat</div>
          </Link>
        </div>
      </section>

      {/* MARKET INSIGHTS */}
      <section className="fx-market container">
        <div className="mi-head">
          <h3>Market Insights</h3>
          <Link to="/news" className="view-all">
            → View All
          </Link>
        </div>

        <div className="mi-carousel">
          {news.length ? (
            news.map((n, idx) => <MarketCard key={idx} item={n} />)
          ) : (
            <>
              <MarketCard placeholder />
              <MarketCard placeholder />
              <MarketCard placeholder />
            </>
          )}
        </div>
      </section>

      {/* TOP CRYPTOS */}
      <section className="fx-top container">
        <h3>Top Cryptos</h3>

        <div className="crypto-list">
          {top.length ? (
            top.map((c) => <CryptoRow key={c.id} c={c} />)
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="crypto-row placeholder" />
            ))
          )}
        </div>
      </section>

      {/* TRENDING COINS */}
      <section className="fx-trend container">
        <h3>🔥 Trending Coins</h3>
        <div className="trend-list">
          {trending.map((t) => (
            <div key={t.item.coin_id} className="trend-mini">
              <img src={t.item.small} alt={t.item.name} />
              <div className="t-name">{t.item.name}</div>
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}

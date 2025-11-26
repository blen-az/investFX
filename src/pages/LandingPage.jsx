// src/pages/LandingPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ParticleBackground from "../components/ParticleBackground";
import LivePriceTicker from "../components/LivePriceTicker";
import "./LandingPage.css";

export default function LandingPage() {
  const [trending, setTrending] = useState([]);
  const [news, setNews] = useState([]);

  // Fetch trending crypto
  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/search/trending")
      .then((res) => res.json())
      .then((data) => setTrending(data.coins.slice(0, 3)))
      .catch(() => { });
  }, []);

  // Fetch crypto news
  useEffect(() => {
    fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN")
      .then((res) => res.json())
      .then((data) => setNews(data.Data.slice(0, 3)))
      .catch(() => { });
  }, []);

  return (
    <div className="landing-container">
      <ParticleBackground />

      {/* ================= HERO SECTION ================= */}
      <section className="hero-modern">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title gradient-text animate-fade-in">
              Trade Crypto With Confidence
            </h1>
            <p className="hero-subtitle animate-fade-in">
              Buy, sell & trade digital assets on a fast, secure and modern platform.
              Experience professional-grade trading with real-time data and advanced analytics.
            </p>

            {/* BUTTONS */}
            <div className="hero-buttons animate-slide-in">
              <Link to="/signup" className="btn-primary">
                Get Started
              </Link>
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
            </div>

            {/* FEATURES */}
            <div className="hero-features">
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div className="feature-text">
                  <strong>Lightning Fast</strong>
                  <span>Instant execution</span>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <div className="feature-text">
                  <strong>Bank-Level Security</strong>
                  <span>Your assets protected</span>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-text">
                  <strong>Advanced Charts</strong>
                  <span>Professional tools</span>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE PRICE WIDGET */}
          <div className="hero-widget">
            <div className="glass-card widget-card">
              <h3 className="widget-title">Live Market Prices</h3>
              <LivePriceTicker />
              <div className="widget-stats">
                <div className="stat-item">
                  <span className="stat-label">24h Volume</span>
                  <span className="stat-value text-positive">$2.4T</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active Traders</span>
                  <span className="stat-value gradient-text">120K+</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Cryptocurrencies</span>
                  <span className="stat-value">500+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TRENDING COINS ================= */}
      <section className="trending-section">
        <h2 className="section-title">
          <span className="title-icon">🔥</span>
          Trending Coins
        </h2>

        <div className="trending-grid">
          {trending.map((t) => (
            <div key={t.item.coin_id} className="glass-card trend-card">
              <img src={t.item.small} alt={t.item.name} className="trend-icon" />
              <div className="trend-info">
                <h3 className="trend-name">{t.item.name}</h3>
                <p className="trend-symbol">{t.item.symbol}</p>
              </div>
              <div className="trend-price">
                <span className="price-value text-mono">
                  ${t.item.data.price.toFixed(4)}
                </span>
                <span className={`price-change ${t.item.data.price_change_percentage_24h?.usd >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {t.item.data.price_change_percentage_24h?.usd >= 0 ? '+' : ''}
                  {t.item.data.price_change_percentage_24h?.usd?.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= LATEST NEWS ================= */}
      <section className="news-section">
        <h2 className="section-title">
          <span className="title-icon">📰</span>
          Latest Crypto News
        </h2>

        <div className="news-grid">
          {news.map((n) => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card news-card"
            >
              <img src={n.imageurl} alt={n.title} className="news-image" />
              <div className="news-content">
                <h4 className="news-title">{n.title}</h4>
                <p className="news-body">{n.body.substring(0, 120)}...</p>
                <div className="news-meta">
                  <span className="news-source">{n.source}</span>
                  <span className="news-arrow">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="cta-section">
        <div className="glass-card cta-card">
          <h2 className="cta-title gradient-text">Ready to Start Trading?</h2>
          <p className="cta-subtitle">
            Join thousands of traders already using InvestFX to trade cryptocurrencies
          </p>
          <Link to="/signup" className="btn-primary btn-large">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}

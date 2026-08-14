// src/pages/LandingPage.jsx - Bright, High-Tech, Production-Ready Public Landing Page
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getCryptoPrices } from "../services/priceService";
import {
  Zap,
  ShieldCheck,
  BarChart3,
  Headphones,
  ArrowRight,
  Globe,
  Users,
  CheckCircle2,
  Lock,
  Menu,
  X
} from "lucide-react";
import "./LandingPage.css";

export default function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prices, setPrices] = useState({
    BTC: 63842.10,
    ETH: 3142.88,
    SOL: 142.56,
    BNB: 584.32,
    XRP: 0.5234,
    XAU: 2400.00
  });

  // Fetch real market prices
  useEffect(() => {
    let isMounted = true;
    async function loadPrices() {
      try {
        const liveData = await getCryptoPrices();
        if (isMounted && liveData) {
          setPrices((prev) => ({ ...prev, ...liveData }));
        }
      } catch (err) {
        console.error("Error loading landing prices:", err);
      }
    }
    loadPrices();
    const timer = setInterval(loadPrices, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="landing-page">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          
          {/* Logo */}
          <Link to="/" className="landing-logo">
            <Zap className="logo-bolt" size={24} fill="currentColor" />
            <span>
              <span className="logo-way">Way</span>
              <span className="logo-more">More</span>
            </span>
          </Link>

          {/* Center Navigation */}
          <nav className="landing-nav">
            <Link to="/market" className="nav-link">Markets</Link>
            <Link to="/trade" className="nav-link">Trade</Link>
            <Link to="/market" className="nav-link">Futures</Link>
            <Link to="/news" className="nav-link">Earn</Link>
            <Link to="/news" className="nav-link">Learn</Link>
            <Link to="/regulatory-info" className="nav-link">Company</Link>
          </nav>

          {/* Auth Actions */}
          <div className="landing-auth-actions">
            {user ? (
              <Link to="/home" className="btn-signup">
                Go to Dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-login">Log In</Link>
                <Link to="/signup" className="btn-signup">
                  Sign Up <ArrowRight size={15} />
                </Link>
              </>
            )}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <Link to="/market" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Markets</Link>
            <Link to="/trade" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Trade</Link>
            <Link to="/news" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Earn & Learn</Link>
            <Link to="/regulatory-info" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Company</Link>
            <div style={{ paddingTop: 10, display: "flex", gap: 10 }}>
              {user ? (
                <Link to="/home" className="btn-signup" style={{ width: "100%", justifyContent: "center" }}>
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-login" style={{ flex: 1, textAlign: "center" }}>Log In</Link>
                  <Link to="/signup" className="btn-signup" style={{ flex: 1, justifyContent: "center" }}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ───────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-glow-cyan" />
        <div className="hero-glow-blue" />

        <div className="landing-container hero-grid">
          
          {/* Left Column: Hero Text & CTAs */}
          <div className="hero-content">
            <div className="hero-trust-badge">
              <Users size={13} className="trust-badge-icon" />
              <span>TRUSTED BY 120,000+ TRADERS WORLDWIDE</span>
            </div>

            <h1 className="hero-headline">
              Your Gateway to <br />
              <span className="hero-gradient-text">Crypto Trading</span>
            </h1>

            <p className="hero-subcopy">
              Trade Bitcoin, Ethereum, Gold, and 500+ cryptocurrencies with confidence. Join thousands of traders using professional tools and bank-level security.
            </p>

            {/* CTAs */}
            <div className="hero-cta-group">
              {user ? (
                <Link to="/home" className="btn-hero-primary">
                  Go to Dashboard <ArrowRight size={16} className="arrow-icon" />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn-hero-primary">
                    Start Trading Now <ArrowRight size={16} className="arrow-icon" />
                  </Link>
                  <Link to="/login" className="btn-hero-secondary">
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Hero Metrics Strip */}
            <div className="hero-metrics-grid">
              <div className="metric-card">
                <div className="metric-icon-wrap">
                  <Users size={18} />
                </div>
                <div>
                  <div className="metric-val">120,000+</div>
                  <div className="metric-lbl">Active Traders</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <div className="metric-val">500+</div>
                  <div className="metric-lbl">Cryptocurrencies</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="metric-val">99.9%</div>
                  <div className="metric-lbl">Uptime Guarantee</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Light Trading Terminal & Mobile Mockups */}
          <div className="hero-visual-col">
            <div className="mockup-wrapper">
              
              {/* Glowing Pedestal Base */}
              <div className="mockup-pedestal-glow" />

              {/* Desktop Trading Terminal Shell */}
              <div className="desktop-mockup">
                <div className="mockup-browser-header">
                  <div className="browser-dots">
                    <div className="browser-dot dot-red" />
                    <div className="browser-dot dot-yellow" />
                    <div className="browser-dot dot-green" />
                  </div>
                  <span className="browser-url-bar">waymore.com/trade/btc-usdt</span>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>PRO TERMINAL</span>
                </div>

                <div className="desktop-ui-grid">
                  
                  {/* Chart Area */}
                  <div className="chart-area">
                    <div className="chart-header">
                      <div className="chart-pair">
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F7931A", display: "inline-block" }} />
                        BTC / USDT
                        <span className="chart-change">+2.35%</span>
                      </div>
                      <span className="chart-price">${prices.BTC.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* SVG Candlestick Mockup */}
                    <svg className="candlestick-svg" viewBox="0 0 320 180">
                      <line x1="0" y1="40" x2="320" y2="40" stroke="#F1F5F9" strokeDasharray="3 3" />
                      <line x1="0" y1="90" x2="320" y2="90" stroke="#F1F5F9" strokeDasharray="3 3" />
                      <line x1="0" y1="140" x2="320" y2="140" stroke="#F1F5F9" strokeDasharray="3 3" />

                      {/* Candles */}
                      <line x1="30" y1="110" x2="30" y2="150" stroke="#F04452" strokeWidth="1.5" />
                      <rect x="25" y="120" width="10" height="20" fill="#F04452" rx="1" />

                      <line x1="60" y1="90" x2="60" y2="135" stroke="#00B67A" strokeWidth="1.5" />
                      <rect x="55" y="95" width="10" height="30" fill="#00B67A" rx="1" />

                      <line x1="90" y1="70" x2="90" y2="115" stroke="#00B67A" strokeWidth="1.5" />
                      <rect x="85" y="75" width="10" height="30" fill="#00B67A" rx="1" />

                      <line x1="120" y1="80" x2="120" y2="110" stroke="#F04452" strokeWidth="1.5" />
                      <rect x="115" y="85" width="10" height="18" fill="#F04452" rx="1" />

                      <line x1="150" y1="50" x2="150" y2="95" stroke="#00B67A" strokeWidth="1.5" />
                      <rect x="145" y="55" width="10" height="35" fill="#00B67A" rx="1" />

                      <line x1="180" y1="35" x2="180" y2="70" stroke="#00B67A" strokeWidth="1.5" />
                      <rect x="175" y="40" width="10" height="25" fill="#00B67A" rx="1" />

                      <line x1="210" y1="45" x2="210" y2="85" stroke="#F04452" strokeWidth="1.5" />
                      <rect x="205" y="50" width="10" height="25" fill="#F04452" rx="1" />

                      <line x1="240" y1="20" x2="240" y2="60" stroke="#00B67A" strokeWidth="1.5" />
                      <rect x="235" y="25" width="10" height="30" fill="#00B67A" rx="1" />

                      <line x1="270" y1="15" x2="270" y2="50" stroke="#00B67A" strokeWidth="1.5" />
                      <rect x="265" y="18" width="10" height="26" fill="#00B67A" rx="1" />

                      {/* Cyan Trendline Curve */}
                      <path d="M 25 130 Q 80 110 145 70 T 270 30" fill="none" stroke="#00C2C7" strokeWidth="2.5" />
                    </svg>
                  </div>

                  {/* Order Panel Mock */}
                  <div className="order-panel-mock">
                    <div className="mock-tab-row">
                      <span className="mock-tab active">Trade</span>
                      <span className="mock-tab">Spot</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Order Book</div>
                    <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", color: "#F04452" }}>
                      <span>63,843.90</span>
                      <span>0.2300</span>
                    </div>
                    <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", color: "#F04452" }}>
                      <span>63,842.50</span>
                      <span>0.1520</span>
                    </div>
                    <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", color: "#00B67A" }}>
                      <span>63,840.90</span>
                      <span>0.1200</span>
                    </div>
                    <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", color: "#00B67A" }}>
                      <span>63,840.50</span>
                      <span>0.1800</span>
                    </div>
                    <button className="mock-buy-btn">Buy BTC</button>
                  </div>

                </div>
              </div>

              {/* Front-Left Mobile Phone Frame */}
              <div className="mobile-mockup">
                <div className="mobile-inner">
                  <span className="mobile-balance-title">Total Portfolio</span>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span className="mobile-balance-val">$24,568.00</span>
                    <span className="mobile-balance-pct">+12.35%</span>
                  </div>

                  {/* Mini Area Chart SVG */}
                  <svg viewBox="0 0 160 50" style={{ width: "100%", height: 40 }}>
                    <defs>
                      <linearGradient id="mobGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00C2C7" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#00C2C7" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 40 Q 40 10 80 30 T 160 10 L 160 50 L 0 50 Z" fill="url(#mobGrad)" />
                    <path d="M 0 40 Q 40 10 80 30 T 160 10" fill="none" stroke="#00C2C7" strokeWidth="2" />
                  </svg>

                  <div style={{ fontSize: 10, fontWeight: 700, color: "#08162B" }}>Watchlist</div>
                  <div style={{ fontSize: 10, display: "flex", justifyContent: "space-between", color: "#475569" }}>
                    <span>BTC Bitcoin</span>
                    <span style={{ fontWeight: 700, color: "#08162B" }}>${prices.BTC.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── BENEFITS STRIP ─────────────────────────────────────────── */}
      <section className="benefits-section">
        <div className="landing-container">
          <div className="benefits-grid">
            
            <div className="benefit-card">
              <div className="benefit-icon-box">
                <Zap size={22} />
              </div>
              <div>
                <div className="benefit-title">Lightning Fast</div>
                <div className="benefit-desc">Instant execution with ultra-low latency order processing.</div>
              </div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon-box">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="benefit-title">Bank-Level Security</div>
                <div className="benefit-desc">Multi-layer encryption & cold storage asset protection.</div>
              </div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon-box">
                <BarChart3 size={22} />
              </div>
              <div>
                <div className="benefit-title">Advanced Charts</div>
                <div className="benefit-desc">Professional technical indicators and real-time drawing tools.</div>
              </div>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon-box">
                <Headphones size={22} />
              </div>
              <div>
                <div className="benefit-title">24/7 Support</div>
                <div className="benefit-desc">Real humans. Real support. Anytime you need us.</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── LIVE MARKET STRIP ──────────────────────────────────────── */}
      <section className="market-strip-section">
        <div className="landing-container">
          <div className="market-strip-title">
            <div className="live-dot-indicator" />
            <span>LIVE MARKETS OVERVIEW</span>
          </div>

          <div className="market-ticker-track">
            
            {/* BTC */}
            <Link to="/market" className="ticker-card">
              <div className="ticker-top">
                <span className="ticker-sym">BTC / USDT</span>
                <span className="ticker-change pos">+2.35%</span>
              </div>
              <div className="ticker-price">${prices.BTC.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </Link>

            {/* ETH */}
            <Link to="/market" className="ticker-card">
              <div className="ticker-top">
                <span className="ticker-sym">ETH / USDT</span>
                <span className="ticker-change pos">+1.12%</span>
              </div>
              <div className="ticker-price">${prices.ETH.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </Link>

            {/* SOL */}
            <Link to="/market" className="ticker-card">
              <div className="ticker-top">
                <span className="ticker-sym">SOL / USDT</span>
                <span className="ticker-change neg">-0.45%</span>
              </div>
              <div className="ticker-price">${prices.SOL.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </Link>

            {/* BNB */}
            <Link to="/market" className="ticker-card">
              <div className="ticker-top">
                <span className="ticker-sym">BNB / USDT</span>
                <span className="ticker-change pos">+1.78%</span>
              </div>
              <div className="ticker-price">${prices.BNB.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </Link>

            {/* XRP */}
            <Link to="/market" className="ticker-card">
              <div className="ticker-top">
                <span className="ticker-sym">XRP / USDT</span>
                <span className="ticker-change pos">+0.68%</span>
              </div>
              <div className="ticker-price">${prices.XRP.toFixed(4)}</div>
            </Link>

            {/* Gold */}
            <Link to="/market" className="ticker-card">
              <div className="ticker-top">
                <span className="ticker-sym">⚜ XAU / USD (Gold)</span>
                <span className="ticker-change pos">+0.85%</span>
              </div>
              <div className="ticker-price">${prices.XAU.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </Link>

          </div>
        </div>
      </section>

      {/* ── PLATFORM EXPERIENCE SECTION ───────────────────────────── */}
      <section className="experience-section">
        <div className="landing-container">
          <div className="section-header-center">
            <span className="section-badge">PLATFORM EXPERIENCE</span>
            <h2 className="section-title">Everything you need to trade with confidence</h2>
            <p className="section-subtitle">Professional tools without unnecessary complexity.</p>
          </div>

          <div className="experience-grid">
            
            {/* Feature 1 */}
            <div className="exp-card">
              <div>
                <h3 className="exp-card-title">Professional Trading Terminal</h3>
                <p className="exp-card-desc">
                  Access live order books, real-time depth charts, flexible order types (Market, Limit, Stop), and technical drawing indicators built for active traders.
                </p>
              </div>
              <div style={{ background: "#F1F5F9", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#08162B", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>BTC / USDT Order Depth</span>
                  <span style={{ color: "#00C2C7" }}>LIVE</span>
                </div>
                <div style={{ height: 60, background: "linear-gradient(90deg, rgba(0,182,122,0.15) 50%, rgba(240,68,82,0.15) 50%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#64748B" }}>
                  Equal Buy/Sell Order Liquidity
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="exp-card">
              <div>
                <h3 className="exp-card-title">Portfolio & Asset Management</h3>
                <p className="exp-card-desc">
                  Track total portfolio balance, net earnings, transaction timelines, and asset allocations in one unified clean interface.
                </p>
              </div>
              <div style={{ background: "#F1F5F9", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#08162B" }}>Total Portfolio Balance</div>
                <div style={{ fontSize: 24, fontStyle: "normal", fontWeight: 900, color: "#08162B", marginTop: 4 }}>$24,568.00</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── WHY WAYMORE SECTION ───────────────────────────────────── */}
      <section className="why-section">
        <div className="landing-container">
          <div className="section-header-center">
            <span className="section-badge">WHY WAYMORE</span>
            <h2 className="section-title">Built for speed, security, and global accessibility</h2>
          </div>

          <div className="why-grid">
            
            <div className="why-card">
              <div className="why-icon">
                <Zap size={24} />
              </div>
              <h3 className="why-title">Ultra-Low Latency</h3>
              <p className="why-desc">Engineered for sub-second execution speeds, ensuring your market orders enter the ledger instantly.</p>
            </div>

            <div className="why-card">
              <div className="why-icon">
                <Lock size={24} />
              </div>
              <h3 className="why-title">Institutional Security</h3>
              <p className="why-desc">Multi-signature cold storage vaults, end-to-end encrypted sessions, and automated anomaly prevention.</p>
            </div>

            <div className="why-card">
              <div className="why-icon">
                <Globe size={24} />
              </div>
              <h3 className="why-title">Global Markets</h3>
              <p className="why-desc">Trade crypto assets and gold (XAU) worldwide with seamless instant currency conversion.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECURITY SECTION ──────────────────────────────────────── */}
      <section className="security-section">
        <div className="landing-container">
          <div className="security-box">
            
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#00C2C7", letterSpacing: "0.06em", textTransform: "uppercase" }}>SECURITY FIRST</span>
              <h2 className="security-title">Built with security at the core</h2>
              <p className="security-desc">
                WayMore employs bank-grade security protocols, robust identity verification, and multi-factor authentication to protect your funds and personal privacy.
              </p>
              {user ? (
                <Link to="/home" className="btn-hero-primary">
                  Go to Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <Link to="/signup" className="btn-hero-primary">
                  Create Free Account <ArrowRight size={16} />
                </Link>
              )}
            </div>

            <div className="security-list">
              <div className="sec-item">
                <CheckCircle2 size={18} className="sec-check-icon" />
                <span>Multi-Layer Session Encryption</span>
              </div>
              <div className="sec-item">
                <CheckCircle2 size={18} className="sec-check-icon" />
                <span>Cold Storage Vault Protection</span>
              </div>
              <div className="sec-item">
                <CheckCircle2 size={18} className="sec-check-icon" />
                <span>Automated Real-Time Risk Engine</span>
              </div>
              <div className="sec-item">
                <CheckCircle2 size={18} className="sec-check-icon" />
                <span>Strict Withdrawal Safeguards</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FINAL CTA SECTION ─────────────────────────────────────── */}
      <section className="final-cta-section">
        <div className="landing-container">
          <div className="cta-banner">
            <h2 className="cta-title">Ready to trade smarter?</h2>
            <p className="cta-desc">Join thousands of traders accessing modern professional tools designed for today's financial markets.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              {user ? (
                <Link to="/home" className="btn-hero-primary">
                  Go to Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn-hero-primary">
                    Start Trading Now <ArrowRight size={16} />
                  </Link>
                  <Link to="/login" className="btn-hero-secondary">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            
            <div className="footer-brand-col">
              <Link to="/" className="landing-logo">
                <Zap className="logo-bolt" size={22} fill="currentColor" />
                <span>
                  <span className="logo-way">Way</span>
                  <span className="logo-more">More</span>
                </span>
              </Link>
              <p style={{ marginTop: 8, color: "#64748B", fontSize: 13, lineHeight: 1.6 }}>
                Next-generation financial operating system for crypto trading and global asset management.
              </p>
            </div>

            <div>
              <div className="footer-col-title">Markets</div>
              <div className="footer-links">
                <Link to="/market" className="footer-link">Bitcoin (BTC)</Link>
                <Link to="/market" className="footer-link">Ethereum (ETH)</Link>
                <Link to="/market" className="footer-link">Solana (SOL)</Link>
                <Link to="/market" className="footer-link">Gold (XAU)</Link>
              </div>
            </div>

            <div>
              <div className="footer-col-title">Platform</div>
              <div className="footer-links">
                <Link to="/trade" className="footer-link">Spot Trading</Link>
                <Link to="/trade" className="footer-link">Quick Trade</Link>
                <Link to="/market" className="footer-link">Live Ticker</Link>
                <Link to="/news" className="footer-link">Market News</Link>
              </div>
            </div>

            <div>
              <div className="footer-col-title">Account</div>
              <div className="footer-links">
                <Link to="/login" className="footer-link">Sign In</Link>
                <Link to="/signup" className="footer-link">Create Account</Link>
                <Link to="/verification" className="footer-link">Verification</Link>
                <Link to="/settings" className="footer-link">Security Center</Link>
              </div>
            </div>

            <div>
              <div className="footer-col-title">Company</div>
              <div className="footer-links">
                <Link to="/regulatory-info" className="footer-link">Regulatory Info</Link>
                <Link to="/live-chat" className="footer-link">Support</Link>
                <Link to="/regulatory-info" className="footer-link">Privacy Policy</Link>
                <Link to="/regulatory-info" className="footer-link">Terms of Service</Link>
              </div>
            </div>

          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} WayMore Trading. All rights reserved.</span>
            <span>Built with precision for serious traders.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

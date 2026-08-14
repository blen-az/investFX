// src/components/LoadingPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { Zap, ShieldCheck, Activity, Sparkles, Globe, RefreshCw } from "lucide-react";
import "./LoadingPage.css";

const STAGES = [
  { pct: 20, text: "Securing your session..." },
  { pct: 45, text: "Loading your portfolio..." },
  { pct: 72, text: "Syncing market data..." },
  { pct: 90, text: "Preparing WayMore..." },
  { pct: 100, text: "Ready" },
];

export default function LoadingPage({
  onComplete,
  realProgress,
  statusMessage,
  minDuration = 600
}) {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState(STAGES[0].text);
  const [isExiting, setIsExiting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const startTimeRef = useRef(Date.now());
  const slowTimerRef = useRef(null);

  // ── Controlled Real/Simulated Progress Pipeline ────────────────────
  useEffect(() => {
    // Handle external progress override if provided
    if (typeof realProgress === "number") {
      const clamped = Math.min(100, Math.max(0, realProgress));
      setProgress(clamped);

      if (clamped < 30) setStatusText("Securing your session...");
      else if (clamped < 60) setStatusText("Loading your portfolio...");
      else if (clamped < 90) setStatusText("Syncing market data...");
      else if (clamped < 100) setStatusText("Preparing WayMore...");
      else setStatusText("Ready");

      if (clamped >= 100) {
        handleFinish();
      }
      return;
    }

    // Default smooth booting sequence
    let currentStage = 0;
    const interval = setInterval(() => {
      currentStage += 1;
      if (currentStage < STAGES.length) {
        setProgress(STAGES[currentStage].pct);
        setStatusText(statusMessage || STAGES[currentStage].text);
      } else {
        clearInterval(interval);
        handleFinish();
      }
    }, 180);

    // Slow load notification check (>4.5s)
    slowTimerRef.current = setTimeout(() => {
      if (progress < 100) {
        setStatusText("Still syncing your account...");
      }
    }, 4500);

    return () => {
      clearInterval(interval);
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realProgress, statusMessage]);

  const handleFinish = () => {
    const elapsed = Date.now() - startTimeRef.current;
    const remainingDelay = Math.max(0, minDuration - elapsed);

    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 400); // match exit CSS animation
    }, remainingDelay);
  };

  const handleRetry = () => {
    setHasError(false);
    setProgress(20);
    setStatusText("Securing your session...");
    startTimeRef.current = Date.now();
  };

  return (
    <div
      className={`nebula-loading-screen${isExiting ? " exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading WayMore"
    >
      {/* ── Layered Particles ─────────────────────────────────────── */}
      <div className="nebula-particles" aria-hidden="true">
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
      </div>

      {/* ── Main Center Content Column ────────────────────────────── */}
      <div className="nebula-center-content">
        
        {/* Glass Logo Tile */}
        <div className={`glass-logo-tile${progress >= 100 ? " ready" : ""}`}>
          <Zap className="lightning-icon" fill="currentColor" />
        </div>

        {/* Wordmark */}
        <h1 className="nebula-brand-wordmark">
          <span className="wordmark-way">Way</span>
          <span className="wordmark-more">More</span>
        </h1>

        {/* Tagline */}
        <p className="nebula-tagline">Future Finance. Simplified.</p>

        {hasError ? (
          /* Error State Fallback */
          <div className="nebula-error-card">
            <span className="error-title">Connection Timeout</span>
            <p className="error-desc">We couldn't initialize your session. Please check your network connection.</p>
            <button className="retry-btn" onClick={handleRetry}>
              <RefreshCw size={13} style={{ marginRight: 6 }} /> Try Again
            </button>
          </div>
        ) : (
          /* Progress & Status */
          <>
            <div className="nebula-progress-row">
              <div className="nebula-progress-track">
                <div
                  className="nebula-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="nebula-progress-pct">{Math.round(progress)}%</span>
            </div>

            <div className="nebula-status-box">
              <span className="nebula-status-text">{statusText}</span>
            </div>
          </>
        )}

      </div>

      {/* ── Bottom Glass Feature Strip ────────────────────────────── */}
      <div className="nebula-feature-strip">
        <div className="feature-item">
          <ShieldCheck size={16} className="feature-icon" />
          <span>Secure</span>
        </div>
        <div className="feature-divider" />
        <div className="feature-item">
          <Activity size={16} className="feature-icon" />
          <span>Real-time</span>
        </div>
        <div className="feature-divider" />
        <div className="feature-item">
          <Sparkles size={16} className="feature-icon" />
          <span>Smart</span>
        </div>
        <div className="feature-divider" />
        <div className="feature-item">
          <Globe size={16} className="feature-icon" />
          <span>Global</span>
        </div>
      </div>

    </div>
  );
}

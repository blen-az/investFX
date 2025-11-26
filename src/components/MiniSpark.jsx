import React, { useEffect, useRef } from "react";

/**
 * MiniSpark
 * - Very light canvas sparkline for quick rendering
 * - props:
 *    prices: array of numbers (small, e.g. 32-64)
 *    up: boolean (color choice)
 */
export default function MiniSpark({ prices = [], up = true }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.max(1, w * dpr);
    canvas.height = Math.max(1, h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (!prices || prices.length < 2) return;

    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const pad = 4;
    const innerW = Math.max(1, w - pad * 2);
    const innerH = Math.max(1, h - pad * 2);

    // draw line
    ctx.beginPath();
    prices.forEach((p, i) => {
      const x = pad + (i / (prices.length - 1)) * innerW;
      const y = pad + innerH - ((p - min) / (max - min || 1)) * innerH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = up ? "var(--positive)" : "var(--negative)";
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // subtle gradient fill under the curve (very light)
    try {
      ctx.lineTo(pad + innerW, pad + innerH);
      ctx.lineTo(pad, pad + innerH);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, pad, 0, pad + innerH);
      const color = up ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)";
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fill();
    } catch (e) {
      // non-critical
    }
  }, [prices, up]);

  return <canvas ref={ref} style={{ width: "100%", height: 40, display: "block" }} />;
}

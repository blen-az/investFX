// src/components/PageLoader.jsx
import React from "react";
import { Zap } from "lucide-react";
import "./PageLoader.css";

export default function PageLoader({ text = "Loading..." }) {
  return (
    <div className="page-loader-container" role="status" aria-live="polite">
      <div className="page-loader-spinner">
        <Zap className="page-loader-icon" fill="currentColor" />
      </div>
      {text && <span className="page-loader-text">{text}</span>}
    </div>
  );
}

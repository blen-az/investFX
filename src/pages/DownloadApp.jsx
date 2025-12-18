// src/pages/DownloadApp.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './SimpleFeaturePage.css';

export default function DownloadApp() {
    return (
        <div className="simple-feature-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>Download App</h1>
            </div>

            <div className="feature-container">
                <div className="download-section">
                    <h2>📱 Get the Mobile App</h2>
                    <p>Trade on the go with our mobile app</p>

                    <div className="app-buttons">
                        <a href="#" className="app-store-btn">
                            🍎 App Store
                        </a>
                        <a href="#" className="app-store-btn">
                            🤖 Play Store
                        </a>
                    </div>

                    <div className="qr-placeholder">
                        <div className="qr-box">QR Code</div>
                        <p>Scan to download</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

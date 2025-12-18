// src/pages/PaymentMethods.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './SimpleFeaturePage.css';

export default function PaymentMethods() {
    return (
        <div className="simple-feature-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>Payment Methods</h1>
            </div>

            <div className="feature-container">
                <div className="empty-state">
                    <div className="empty-icon">💰</div>
                    <h3>No Payment Methods</h3>
                    <p>Add a bank account or card for fiat deposits and withdrawals</p>
                    <button className="add-button">+ Add Payment Method</button>
                </div>
            </div>
        </div>
    );
}

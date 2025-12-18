// src/pages/WithdrawalAddress.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './SimpleFeaturePage.css';

export default function WithdrawalAddress() {
    return (
        <div className="simple-feature-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>Withdrawal Address</h1>
            </div>

            <div className="feature-container">
                <div className="empty-state">
                    <div className="empty-icon">🏦</div>
                    <h3>No Withdrawal Addresses Yet</h3>
                    <p>Add a crypto wallet address or bank account to receive withdrawals</p>
                    <button className="add-button">+ Add Address</button>
                </div>
            </div>
        </div>
    );
}

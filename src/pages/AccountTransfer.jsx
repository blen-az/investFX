// src/pages/AccountTransfer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AccountTransfer.css';

export default function AccountTransfer() {
    const [amount, setAmount] = useState('');
    const [fromAccount, setFromAccount] = useState('main');
    const [toAccount, setToAccount] = useState('trading');

    const handleTransfer = () => {
        // TODO: Implement transfer logic
        alert(`Transfer $${amount} from ${fromAccount} to ${toAccount}`);
    };

    return (
        <div className="account-transfer-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>Account Transfer</h1>
            </div>

            <div className="transfer-container">
                <div className="transfer-card">
                    <div className="form-group">
                        <label>From Account</label>
                        <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)}>
                            <option value="main">Main Account</option>
                            <option value="trading">Trading Account</option>
                        </select>
                    </div>

                    <div className="transfer-arrow">↓</div>

                    <div className="form-group">
                        <label>To Account</label>
                        <select value={toAccount} onChange={(e) => setToAccount(e.target.value)}>
                            <option value="trading">Trading Account</option>
                            <option value="main">Main Account</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Amount</label>
                        <input
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <button className="transfer-button" onClick={handleTransfer} disabled={!amount}>
                        Transfer
                    </button>
                </div>

                <div className="info-card">
                    <h3>ℹ️ Transfer Information</h3>
                    <ul>
                        <li>Transfers between accounts are instant</li>
                        <li>No fees for internal transfers</li>
                        <li>Minimum transfer: $10</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

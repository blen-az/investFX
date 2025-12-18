// src/pages/Exchange.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Exchange.css';

export default function Exchange() {
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [amount, setAmount] = useState('');
    const [exchangeRate] = useState(0.92); // Mock rate

    const convertedAmount = amount ? (parseFloat(amount) * exchangeRate).toFixed(2) : '0.00';

    return (
        <div className="exchange-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>Exchange</h1>
            </div>

            <div className="exchange-container">
                <div className="exchange-card">
                    <div className="currency-section">
                        <label>From</label>
                        <div className="currency-input">
                            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="exchange-icon">⇄</div>

                    <div className="currency-section">
                        <label>To</label>
                        <div className="currency-input">
                            <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                            </select>
                            <input
                                type="text"
                                value={convertedAmount}
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="exchange-rate">
                        <div>Exchange Rate: 1 {fromCurrency} = {exchangeRate} {toCurrency}</div>
                    </div>

                    <button className="exchange-button" disabled={!amount}>
                        Exchange
                    </button>
                </div>
            </div>
        </div>
    );
}

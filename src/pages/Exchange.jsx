// src/pages/Exchange.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { exchangeCurrency, getExchangeRate } from '../services/walletService';
import './Exchange.css';

export default function Exchange() {
    const { user } = useAuth();
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [amount, setAmount] = useState('');
    const [exchangeRate, setExchangeRate] = useState(0.92);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const convertedAmount = amount ? (parseFloat(amount) * exchangeRate).toFixed(2) : '0.00';

    // Update exchange rate when currencies change
    useEffect(() => {
        const rate = getExchangeRate(fromCurrency, toCurrency);
        setExchangeRate(rate);
    }, [fromCurrency, toCurrency]);

    const handleExchange = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const result = await exchangeCurrency(
                user.uid,
                fromCurrency,
                toCurrency,
                parseFloat(amount),
                exchangeRate
            );

            setSuccess(`Successfully exchanged ${amount} ${fromCurrency} to ${result.convertedAmount.toFixed(2)} ${toCurrency}`);
            setAmount('');
        } catch (err) {
            setError(err.message || 'Exchange failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="exchange-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>Exchange</h1>
            </div>

            <div className="exchange-container">
                <div className="exchange-card">
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

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

                    <button
                        className="exchange-button"
                        disabled={!amount || loading}
                        onClick={handleExchange}
                    >
                        {loading ? 'Processing...' : 'Exchange'}
                    </button>
                </div>
            </div>
        </div>
    );
}

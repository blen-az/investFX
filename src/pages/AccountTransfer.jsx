// src/pages/AccountTransfer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { transferBetweenAccounts } from '../services/walletService';
import './AccountTransfer.css';

export default function AccountTransfer() {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [fromAccount, setFromAccount] = useState('funding');
    const [toAccount, setToAccount] = useState('spot');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleTransfer = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            await transferBetweenAccounts(
                user.uid,
                fromAccount,
                toAccount,
                parseFloat(amount)
            );

            setSuccess(`Successfully transferred $${amount} from ${fromAccount} to ${toAccount}`);
            setAmount('');
        } catch (err) {
            setError(err.message || 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="account-transfer-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>Account Transfer</h1>
            </div>

            <div className="transfer-container">
                <div className="transfer-card">
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <div className="form-group">
                        <label>From Account</label>
                        <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)}>
                            <option value="funding">Funding Account</option>
                            <option value="spot">Spot Account</option>
                            <option value="futures">Futures Account</option>
                            <option value="earn">Earn Account</option>
                            <option value="contract">Contract Account</option>
                            <option value="fiat">Fiat Account</option>
                            <option value="commission">Commission Account</option>
                        </select>
                    </div>

                    <div className="transfer-arrow">↓</div>

                    <div className="form-group">
                        <label>To Account</label>
                        <select value={toAccount} onChange={(e) => setToAccount(e.target.value)}>
                            <option value="spot">Spot Account</option>
                            <option value="funding">Funding Account</option>
                            <option value="futures">Futures Account</option>
                            <option value="earn">Earn Account</option>
                            <option value="contract">Contract Account</option>
                            <option value="fiat">Fiat Account</option>
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

                    <button
                        className="transfer-button"
                        onClick={handleTransfer}
                        disabled={!amount || loading}
                    >
                        {loading ? 'Processing...' : 'Transfer'}
                    </button>
                </div>

                <div className="info-card">
                    <h3>ℹ️ Transfer Information</h3>
                    <ul>
                        <li>Transfers between accounts are instant</li>
                        <li>No fees for internal transfers</li>
                        <li>Minimum transfer: $1</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

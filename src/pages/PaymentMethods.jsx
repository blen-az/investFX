// src/pages/PaymentMethods.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import './SimpleFeaturePage.css';

export default function PaymentMethods() {
    const { user } = useAuth();
    const [methods, setMethods] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [methodName, setMethodName] = useState('');
    const [accountInfo, setAccountInfo] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'paymentMethods'),
            where('uid', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMethods(list);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!methodName || !accountInfo) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'paymentMethods'), {
                uid: user.uid,
                name: methodName,
                info: accountInfo,
                createdAt: new Date()
            });
            setMethodName('');
            setAccountInfo('');
            setShowForm(false);
        } catch (error) {
            console.error("Error adding payment method:", error);
            alert("Failed to add payment method.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this payment method?")) return;
        try {
            await deleteDoc(doc(db, 'paymentMethods', id));
        } catch (error) {
            console.error("Error deleting payment method:", error);
        }
    };

    return (
        <div className="simple-feature-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>Payment Methods</h1>
            </div>

            <div className="feature-container">
                {showForm ? (
                    <div className="address-form-card glass-card">
                        <h3>Add Payment Method</h3>
                        <form onSubmit={handleAdd}>
                            <div className="form-group">
                                <label>Method Name (e.g. Bank of America, PayPal)</label>
                                <input
                                    type="text"
                                    value={methodName}
                                    onChange={(e) => setMethodName(e.target.value)}
                                    placeholder="Enter bank or gateway name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Account Info (e.g. Account Number, Email)</label>
                                <input
                                    type="text"
                                    value={accountInfo}
                                    onChange={(e) => setAccountInfo(e.target.value)}
                                    placeholder="Enter details"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="add-button" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Method'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="address-header-row">
                            <button className="add-button" onClick={() => setShowForm(true)}>+ Add Method</button>
                        </div>

                        {methods.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">💰</div>
                                <h3>No Payment Methods</h3>
                                <p>Add a bank account or card for fiat deposits and withdrawals</p>
                            </div>
                        ) : (
                            <div className="address-list">
                                {methods.map(method => (
                                    <div key={method.id} className="address-item glass-card">
                                        <div className="address-info">
                                            <div className="address-label">{method.name}</div>
                                            <div className="address-val">{method.info}</div>
                                        </div>
                                        <button className="delete-btn" onClick={() => handleDelete(method.id)}>🗑️</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

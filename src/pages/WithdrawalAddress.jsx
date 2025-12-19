// src/pages/WithdrawalAddress.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import './SimpleFeaturePage.css';

export default function WithdrawalAddress() {
    const { user } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'withdrawalAddresses'),
            where('uid', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAddresses(list);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newLabel || !newAddress) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'withdrawalAddresses'), {
                uid: user.uid,
                label: newLabel,
                address: newAddress,
                createdAt: new Date()
            });
            setNewLabel('');
            setNewAddress('');
            setShowForm(false);
        } catch (error) {
            console.error("Error adding address:", error);
            alert("Failed to add address.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        try {
            await deleteDoc(doc(db, 'withdrawalAddresses', id));
        } catch (error) {
            console.error("Error deleting address:", error);
        }
    };

    return (
        <div className="simple-feature-page">
            <div className="page-header">
                <Link to="/wallet" className="back-button">← Back</Link>
                <h1>Withdrawal Address</h1>
            </div>

            <div className="feature-container">
                {showForm ? (
                    <div className="address-form-card glass-card">
                        <h3>Add New Address</h3>
                        <form onSubmit={handleAdd}>
                            <div className="form-group">
                                <label>Label (e.g. My Ledger, Binance)</label>
                                <input
                                    type="text"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    placeholder="Enter label"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Crypto Address</label>
                                <input
                                    type="text"
                                    value={newAddress}
                                    onChange={(e) => setNewAddress(e.target.value)}
                                    placeholder="Enter address"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="add-button" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Address'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="address-header-row">
                            <button className="add-button" onClick={() => setShowForm(true)}>+ Add Address</button>
                        </div>

                        {addresses.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🏦</div>
                                <h3>No Withdrawal Addresses Yet</h3>
                                <p>Add a crypto wallet address or bank account to receive withdrawals</p>
                            </div>
                        ) : (
                            <div className="address-list">
                                {addresses.map(addr => (
                                    <div key={addr.id} className="address-item glass-card">
                                        <div className="address-info">
                                            <div className="address-label">{addr.label}</div>
                                            <div className="address-val">{addr.address}</div>
                                        </div>
                                        <button className="delete-btn" onClick={() => handleDelete(addr.id)}>🗑️</button>
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

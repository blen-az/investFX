// src/components/AlertModal.jsx
import React from 'react';
import './AlertModal.css';

export default function AlertModal({ isOpen, onClose, title, message, type = 'error' }) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'error':
                return '⚠️';
            case 'success':
                return '✅';
            case 'info':
                return 'ℹ️';
            case 'warning':
                return '⚡';
            default:
                return '⚠️';
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="alert-backdrop" onClick={onClose}></div>

            {/* Modal */}
            <div className="alert-modal">
                <div className="alert-header">
                    <div className="alert-domain">{window.location.hostname} says</div>
                </div>

                <div className="alert-content">
                    <div className="alert-icon">{getIcon()}</div>
                    <div className="alert-message">{message}</div>
                </div>

                <div className="alert-actions">
                    <button className="alert-btn-ok" onClick={onClose}>
                        OK
                    </button>
                </div>
            </div>
        </>
    );
}

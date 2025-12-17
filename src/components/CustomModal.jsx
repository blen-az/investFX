// src/components/CustomModal.jsx
import React from 'react';
import './CustomModal.css';

export default function CustomModal({ isOpen, onClose, title, message, type = 'success' }) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ℹ';
            default:
                return '✓';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className={`modal-icon ${type}`}>
                    {getIcon()}
                </div>

                {title && <div className="modal-title">{title}</div>}

                <div className="modal-message">{message}</div>

                <button className="modal-button" onClick={onClose}>
                    OK
                </button>
            </div>
        </div>
    );
}

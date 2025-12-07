import React from 'react';

export default function LoadingPage() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
            gap: '16px'
        }}>
            <div className="spinner" style={{
                width: '48px',
                height: '48px',
                border: '4px solid rgba(6, 182, 212, 0.2)',
                borderTop: '4px solid #06b6d4',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }} />
            <div style={{
                color: '#94a3b8',
                fontSize: '15px',
                fontWeight: '600'
            }}>
                Loading...
            </div>
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

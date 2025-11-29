// src/pages/admin/TradeSettings.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getTradeSettings, updateTradeSettings } from "../../services/tradeSettingsService";
import "./Users.css";

export default function TradeSettings() {
    const { user } = useAuth();
    const [currentMode, setCurrentMode] = useState("auto");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const settings = await getTradeSettings();
            setCurrentMode(settings.globalMode || "auto");
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateTradeSettings(currentMode, user?.uid);
            alert("Trade settings updated successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to update settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const modes = [
        {
            value: "auto",
            label: "Auto (Price-Based)",
            description: "Trades settle based on actual price movement",
            icon: "🤖",
            color: "#06b6d4"
        },
        {
            value: "force_win",
            label: "Force Win",
            description: "All users will win their trades",
            icon: "🏆",
            color: "#10b981"
        },
        {
            value: "force_loss",
            label: "Force Loss",
            description: "All users will lose their trades",
            icon: "📉",
            color: "#ef4444"
        }
    ];

    if (loading) {
        return (
            <div className="users-page">
                <div className="loading-state">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="users-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title gradient-text">Trade Control Settings</h1>
                    <p className="page-subtitle">Configure global trade outcome behavior</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#f8fafc' }}>
                        Global Trade Mode
                    </h3>
                    <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                        This setting controls how all user trades are settled. User-specific overrides take priority.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    {modes.map((mode) => (
                        <div
                            key={mode.value}
                            onClick={() => setCurrentMode(mode.value)}
                            style={{
                                padding: '20px',
                                borderRadius: '12px',
                                border: `2px solid ${currentMode === mode.value ? mode.color : 'rgba(100, 116, 139, 0.2)'}`,
                                background: currentMode === mode.value ? `${mode.color}15` : 'rgba(26, 31, 46, 0.8)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                        >
                            <div style={{ fontSize: '32px' }}>{mode.icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: currentMode === mode.value ? mode.color : '#f8fafc',
                                    marginBottom: '4px'
                                }}>
                                    {mode.label}
                                </div>
                                <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                                    {mode.description}
                                </div>
                            </div>
                            {currentMode === mode.value && (
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: mode.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 700
                                }}>
                                    ✓
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{
                    padding: '16px',
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                        <strong style={{ color: '#06b6d4' }}>ℹ️ Note:</strong>
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                        • User-specific overrides (set in Users page) take priority over this global setting<br />
                        • Changes apply to all new trades immediately<br />
                        • Active trades will use the setting that was active when they started
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 700,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1
                    }}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}

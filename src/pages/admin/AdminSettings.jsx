// src/pages/admin/AdminSettings.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db, auth } from "../../firebase";
import { updatePlatformSettings } from "../../services/adminService";
import "../Settings.css";

// Password Strength Checker
const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    if (checks.length) score++;
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    if (score <= 2) return { score, label: "Weak", color: "#ef4444", checks };
    if (score <= 3) return { score, label: "Medium", color: "#f59e0b", checks };
    return { score, label: "Strong", color: "#10b981", checks };
};

export default function AdminSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [depositSaved, setDepositSaved] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Profile form
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        phone: ""
    });

    // Password form
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // Password strength
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "", checks: {} });

    // Admin Preferences
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        systemAlerts: true,
        securityAlerts: true,
        dashboardRefreshRate: 30 // seconds
    });

    // Platform Settings (Deposit Addresses)
    const [platformSettings, setPlatformSettings] = useState({
        depositAddresses: {
            BTC: "",
            ETH: "",
            USDT: ""
        }
    });

    const loadAdminData = React.useCallback(async () => {
        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setProfileData({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || ""
                });
                setPreferences({
                    emailNotifications: data.emailNotifications !== false,
                    systemAlerts: data.systemAlerts !== false,
                    securityAlerts: data.securityAlerts !== false,
                    dashboardRefreshRate: data.dashboardRefreshRate || 30
                });
            }
        } catch (error) {
            console.error("Error loading admin data:", error);
            showMessage("error", "Failed to load profile data");
        } finally {
            setLoading(false);
        }
    }, [user.uid]);

    useEffect(() => {
        loadAdminData();
    }, [loadAdminData]);

    // Real-time listener for platform settings
    useEffect(() => {
        console.log("🔌 [Admin] Setting up platform settings listener...");
        const settingsRef = doc(db, "settings", "platform");
        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            console.log("📡 [Admin] Received update from Firestore");
            if (docSnap.exists()) {
                const settings = docSnap.data();
                console.log("📦 [Admin] Platform settings data:", settings);
                setPlatformSettings(prev => ({
                    ...prev,
                    ...settings,
                    depositAddresses: {
                        ...prev.depositAddresses,
                        ...(settings.depositAddresses || {})
                    }
                }));
                console.log("✅ [Admin] Deposit addresses updated in state");
            } else {
                console.log("⚠️ [Admin] Settings document doesn't exist yet");
            }
        }, (error) => {
            console.error("❌ [Admin] Error listening to platform settings:", error);
        });

        return () => {
            console.log("🔌 [Admin] Cleaning up platform settings listener");
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        setPasswordStrength(getPasswordStrength(passwordData.newPassword));
    }, [passwordData.newPassword]);



    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            await updateDoc(doc(db, "users", user.uid), {
                name: profileData.name,
                phone: profileData.phone,
                updatedAt: new Date()
            });

            if (profileData.email !== user.email) {
                await updateEmail(auth.currentUser, profileData.email);
            }

            showMessage("success", "Profile updated successfully!");
            await loadAdminData();
        } catch (error) {
            console.error("Error updating profile:", error);
            if (error.code === "auth/requires-recent-login") {
                showMessage("error", "Please log out and log back in to change your email");
            } else {
                showMessage("error", "Failed to update profile: " + error.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showMessage("error", "New passwords don't match");
            return;
        }

        if (passwordStrength.score < 3) {
            showMessage("error", "Please choose a stronger password");
            return;
        }

        try {
            setSaving(true);

            const credential = EmailAuthProvider.credential(
                user.email,
                passwordData.currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, passwordData.newPassword);

            showMessage("success", "Password changed successfully!");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
            console.error("Error changing password:", error);
            if (error.code === "auth/wrong-password") {
                showMessage("error", "Current password is incorrect");
            } else {
                showMessage("error", "Failed to change password: " + error.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const handlePlatformSettingsUpdate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setDepositSaved(false);
            console.log("🔄 Starting deposit address save...");
            await updatePlatformSettings(platformSettings);
            console.log("✅ Deposit addresses saved successfully!");
            showMessage("success", "Platform settings updated successfully!");
            setDepositSaved(true);
            // Reset saved status after 3 seconds
            setTimeout(() => setDepositSaved(false), 3000);
        } catch (error) {
            console.error("❌ Error updating platform settings:", error);
            showMessage("error", "Failed to update platform settings");
            setDepositSaved(false);
        } finally {
            setSaving(false);
        }
    };

    const handlePreferencesUpdate = async () => {
        try {
            setSaving(true);
            await updateDoc(doc(db, "users", user.uid), {
                ...preferences,
                updatedAt: new Date()
            });
            showMessage("success", "Preferences saved!");
        } catch (error) {
            console.error("Error updating preferences:", error);
            showMessage("error", "Failed to save preferences");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="page-header">
                <h1 className="gradient-text">Admin Settings</h1>
                <p>Manage your administrator account and system preferences</p>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Settings */}
            <div className="settings-section glass-card">
                <div className="section-header">
                    <div className="section-icon">👤</div>
                    <div>
                        <h2>Profile Information</h2>
                        <p>Update your personal details</p>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="settings-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="form-input"
                            required
                        />
                        <small>Changing email requires re-authentication</small>
                    </div>

                    <div className="form-group">
                        <label>Phone Number (Optional)</label>
                        <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="form-input"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? "Saving..." : "Save Profile"}
                    </button>
                </form>
            </div>

            {/* Password Change */}
            <div className="settings-section glass-card">
                <div className="section-header">
                    <div className="section-icon">🔒</div>
                    <div>
                        <h2>Change Password</h2>
                        <p>Update your account password</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="settings-form">
                    <div className="form-group">
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="form-input"
                            required
                        />

                        {passwordData.newPassword && (
                            <div className="password-strength">
                                <div className="strength-bar">
                                    <div
                                        className="strength-fill"
                                        style={{
                                            width: `${(passwordStrength.score / 5) * 100}%`,
                                            backgroundColor: passwordStrength.color
                                        }}
                                    ></div>
                                </div>
                                <span className="strength-label" style={{ color: passwordStrength.color }}>
                                    {passwordStrength.label}
                                </span>

                                <div className="password-requirements">
                                    <div className={passwordStrength.checks?.length ? "req-met" : "req-unmet"}>
                                        {passwordStrength.checks?.length ? "✓" : "○"} At least 8 characters
                                    </div>
                                    <div className={passwordStrength.checks?.lowercase ? "req-met" : "req-unmet"}>
                                        {passwordStrength.checks?.lowercase ? "✓" : "○"} Lowercase letter
                                    </div>
                                    <div className={passwordStrength.checks?.uppercase ? "req-met" : "req-unmet"}>
                                        {passwordStrength.checks?.uppercase ? "✓" : "○"} Uppercase letter
                                    </div>
                                    <div className={passwordStrength.checks?.number ? "req-met" : "req-unmet"}>
                                        {passwordStrength.checks?.number ? "✓" : "○"} Number
                                    </div>
                                    <div className={passwordStrength.checks?.special ? "req-met" : "req-unmet"}>
                                        {passwordStrength.checks?.special ? "✓" : "○"} Special character
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="form-input"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving || passwordStrength.score < 3}>
                        {saving ? "Changing..." : "Change Password"}
                    </button>
                </form>
            </div>

            {/* Admin Preferences */}
            <div className="settings-section glass-card">
                <div className="section-header">
                    <div className="section-icon">⚙️</div>
                    <div>
                        <h2>System Preferences</h2>
                        <p>Configure your admin dashboard settings</p>
                    </div>
                </div>

                <div className="preferences-list">
                    <div className="preference-item">
                        <div>
                            <h3>Email Notifications</h3>
                            <p>Receive email updates for important events</p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={preferences.emailNotifications}
                                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="preference-item">
                        <div>
                            <h3>System Alerts</h3>
                            <p>Get notified about system events and updates</p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={preferences.systemAlerts}
                                onChange={(e) => setPreferences({ ...preferences, systemAlerts: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="preference-item">
                        <div>
                            <h3>Security Alerts</h3>
                            <p>Receive alerts for security-related events</p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={preferences.securityAlerts}
                                onChange={(e) => setPreferences({ ...preferences, securityAlerts: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="preference-item">
                        <div>
                            <h3>Dashboard Refresh Rate</h3>
                            <p>How often to refresh dashboard data (seconds)</p>
                        </div>
                        <select
                            value={preferences.dashboardRefreshRate}
                            onChange={(e) => setPreferences({ ...preferences, dashboardRefreshRate: parseInt(e.target.value) })}
                            className="form-input"
                            style={{ maxWidth: '200px' }}
                        >
                            <option value={10}>10 seconds</option>
                            <option value={30}>30 seconds</option>
                            <option value={60}>1 minute</option>
                            <option value={300}>5 minutes</option>
                        </select>
                    </div>

                    <button onClick={handlePreferencesUpdate} className="btn btn-secondary" disabled={saving}>
                        {saving ? "Saving..." : "Save Preferences"}
                    </button>
                </div>
            </div>

            {/* Platform Settings (Deposit Addresses) */}
            <div className="settings-section glass-card">
                <div className="section-header">
                    <div className="section-icon">💰</div>
                    <div>
                        <h2>Deposit Addresses</h2>
                        <p>Configure cryptocurrency wallet addresses for user deposits</p>
                    </div>
                </div>

                <form onSubmit={handlePlatformSettingsUpdate} className="settings-form">
                    <div className="form-group">
                        <label>Bitcoin (BTC) Address</label>
                        <input
                            type="text"
                            value={platformSettings.depositAddresses.BTC}
                            onChange={(e) => setPlatformSettings({
                                ...platformSettings,
                                depositAddresses: { ...platformSettings.depositAddresses, BTC: e.target.value }
                            })}
                            className="form-input"
                            placeholder="bc1q..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Ethereum (ETH) Address</label>
                        <input
                            type="text"
                            value={platformSettings.depositAddresses.ETH}
                            onChange={(e) => setPlatformSettings({
                                ...platformSettings,
                                depositAddresses: { ...platformSettings.depositAddresses, ETH: e.target.value }
                            })}
                            className="form-input"
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Tether (USDT TRC20) Address</label>
                        <input
                            type="text"
                            value={platformSettings.depositAddresses.USDT}
                            onChange={(e) => setPlatformSettings({
                                ...platformSettings,
                                depositAddresses: { ...platformSettings.depositAddresses, USDT: e.target.value }
                            })}
                            className="form-input"
                            placeholder="T..."
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? "Saving..." : depositSaved ? "✓ Saved!" : "Save Deposit Addresses"}
                    </button>
                </form>
            </div>
        </div>
    );
}

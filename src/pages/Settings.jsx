// src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db, auth } from "../firebase";
import "./Settings.css";

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

export default function Settings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    // Preferences
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        tradeNotifications: true,
        depositNotifications: true
    });

    useEffect(() => {
        loadUserData();
    }, [user]);

    useEffect(() => {
        setPasswordStrength(getPasswordStrength(passwordData.newPassword));
    }, [passwordData.newPassword]);

    const loadUserData = async () => {
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
                    tradeNotifications: data.tradeNotifications !== false,
                    depositNotifications: data.depositNotifications !== false
                });
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            showMessage("error", "Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            // Update Firestore document
            await updateDoc(doc(db, "users", user.uid), {
                name: profileData.name,
                phone: profileData.phone,
                updatedAt: new Date()
            });

            // Update email if changed
            if (profileData.email !== user.email) {
                await updateEmail(auth.currentUser, profileData.email);
            }

            showMessage("success", "Profile updated successfully!");
            await loadUserData();
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

            // Re-authenticate user before password change
            const credential = EmailAuthProvider.credential(
                user.email,
                passwordData.currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Update password
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
                <h1 className="gradient-text">Account Settings</h1>
                <p>Manage your account and preferences</p>
            </div>

            {/* Message Alert */}
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

                        {/* Password Strength Indicator */}
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

                                {/* Requirements Checklist */}
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

            {/* Notification Preferences */}
            <div className="settings-section glass-card">
                <div className="section-header">
                    <div className="section-icon">🔔</div>
                    <div>
                        <h2>Notification Preferences</h2>
                        <p>Choose what updates you want to receive</p>
                    </div>
                </div>

                <div className="preferences-list">
                    <div className="preference-item">
                        <div>
                            <h3>Email Notifications</h3>
                            <p>Receive updates via email for important events</p>
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
                            <h3>Trade Notifications</h3>
                            <p>Get notified about your trade results</p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={preferences.tradeNotifications}
                                onChange={(e) => setPreferences({ ...preferences, tradeNotifications: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="preference-item">
                        <div>
                            <h3>Deposit/Withdrawal Alerts</h3>
                            <p>Receive alerts for deposit and withdrawal updates</p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={preferences.depositNotifications}
                                onChange={(e) => setPreferences({ ...preferences, depositNotifications: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <button onClick={handlePreferencesUpdate} className="btn btn-secondary" disabled={saving}>
                        {saving ? "Saving..." : "Save Preferences"}
                    </button>
                </div>
            </div>
        </div>
    );
}

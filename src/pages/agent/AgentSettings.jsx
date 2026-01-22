// src/pages/agent/AgentSettings.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db, auth } from "../../firebase";
import AgentLayout from "./AgentLayout";
import "./AgentSettings.css";

export default function AgentSettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Profile form
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        phone: "",
        bio: ""
    });

    // Password form
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // Preferences
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        chatNotifications: true,
        commissionAlerts: true
    });

    const loadUserData = React.useCallback(async () => {
        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setProfileData({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    bio: data.bio || ""
                });
                setPreferences({
                    emailNotifications: data.emailNotifications !== false,
                    chatNotifications: data.chatNotifications !== false,
                    commissionAlerts: data.commissionAlerts !== false
                });
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            showMessage("error", "Failed to load profile data");
        } finally {
            setLoading(false);
        }
    }, [user.uid]);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

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
                bio: profileData.bio,
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

        if (passwordData.newPassword.length < 6) {
            showMessage("error", "Password must be at least 6 characters");
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
            <div className="agent-settings-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <AgentLayout>
            <div className="agent-settings-page">
                <div className="page-header">
                    <h1 className="gradient-text">Agent Settings</h1>
                    <p>Manage your profile and preferences</p>
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

                        <div className="form-group">
                            <label>Bio (Optional)</label>
                            <textarea
                                value={profileData.bio}
                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                className="form-input"
                                rows="3"
                                placeholder="Tell us about yourself..."
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
                                minLength="6"
                                required
                            />
                            <small>Minimum 6 characters</small>
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

                        <button type="submit" className="btn btn-primary" disabled={saving}>
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
                                <h3>Chat Notifications</h3>
                                <p>Get notified when users send you messages</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={preferences.chatNotifications}
                                    onChange={(e) => setPreferences({ ...preferences, chatNotifications: e.target.checked })}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="preference-item">
                            <div>
                                <h3>Commission Alerts</h3>
                                <p>Receive alerts when you earn new commissions</p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={preferences.commissionAlerts}
                                    onChange={(e) => setPreferences({ ...preferences, commissionAlerts: e.target.checked })}
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
        </AgentLayout>
    );
}

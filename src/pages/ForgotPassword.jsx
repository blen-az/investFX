import React, { useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword } from "../services/authService";
import ParticleBackground from "../components/ParticleBackground";
import "./ForgotPassword.css";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            await resetPassword(email);
            setMessage("Password reset link sent! Check your inbox.");
        } catch (err) {
            console.error(err);
            if (err.code === "auth/user-not-found") {
                setError("No account found with this email.");
            } else {
                setError("Failed to reset password. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-page">
            <ParticleBackground />

            <div className="forgot-password-container">
                <div className="forgot-password-card">
                    <div className="forgot-password-header">
                        <div className="forgot-password-logo">AvaTrade</div>
                        <h2 className="forgot-password-title">Reset Password</h2>
                        <p className="forgot-password-subtitle">
                            Enter your email to receive a password reset link
                        </p>
                    </div>

                    {message && <div className="success-message">{message}</div>}
                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="forgot-password-form">
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="reset-btn" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>

                    <div className="forgot-password-footer">
                        Remember your password?{" "}
                        <Link to="/login" className="back-to-login-link">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

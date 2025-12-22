// src/pages/VerifyEmail.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ParticleBackground from "../components/ParticleBackground";
import { ROLES } from "../constants/roles";
import "./Login.css"; // Reuse Login.css for consistent styling

export default function VerifyEmail() {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timer, setTimer] = useState(60);
    const { user, userRole, emailVerified, verifyEmailOTP, resendOTP } = useAuth();
    const navigate = useNavigate();
    const inputRefs = useRef([]);

    // Redirect if already verified
    useEffect(() => {
        if (user && emailVerified) {
            if (userRole === ROLES.ADMIN) {
                navigate("/admin/dashboard", { replace: true });
            } else if (userRole === ROLES.AGENT) {
                navigate("/agent/dashboard", { replace: true });
            } else {
                navigate("/home", { replace: true });
            }
        }
    }, [user, emailVerified, userRole, navigate]);

    // Resend timer
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        // Take only the last character entered
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) {
            setError("Please enter all 6 digits.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const result = await verifyEmailOTP(code);
            if (result.success) {
                setSuccess("Email verified successfully! Redirecting...");
                setTimeout(() => {
                    // Navigation happens via UserRole useEffect
                }, 1500);
            } else {
                setError(result.message || "Invalid verification code.");
            }
        } catch (err) {
            setError(err.message || "Failed to verify. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        setResending(true);
        setError("");
        try {
            await resendOTP();
            setTimer(60);
            setSuccess("A new code has been sent to your email.");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError("Failed to resend code. Please try again.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="login-page">
            <ParticleBackground />

            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo">AvaTrade</div>
                        <h2 className="login-title">Verify Email</h2>
                        <p className="login-subtitle">
                            We've sent a 6-digit code to <br />
                            <strong>{user?.email}</strong>
                        </p>
                    </div>

                    {error && <div className="error-message" style={{ textAlign: 'center' }}>{error}</div>}
                    {success && <div style={{
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '14px',
                        textAlign: 'center',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>{success}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '30px' }}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    className="form-input"
                                    style={{
                                        width: '45px',
                                        height: '55px',
                                        textAlign: 'center',
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        padding: '0',
                                        borderRadius: '10px'
                                    }}
                                    value={digit}
                                    onChange={(e) => handleChange(e, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    required
                                />
                            ))}
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? "Verifying..." : "Verify Code"}
                        </button>
                    </form>

                    <div className="login-footer" style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            Didn't receive the code?{" "}
                            <button
                                onClick={handleResend}
                                className="login-link"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: timer > 0 ? 'not-allowed' : 'pointer',
                                    opacity: timer > 0 ? 0.5 : 1,
                                    padding: '0'
                                }}
                                disabled={timer > 0 || resending}
                            >
                                {resending ? "Resending..." : timer > 0 ? `Resend in ${timer}s` : "Resend Now"}
                            </button>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(100, 116, 139, 0.1)', paddingTop: '15px' }}>
                            <button
                                onClick={async () => {
                                    await logout();
                                    navigate("/", { replace: true });
                                }}
                                className="login-link"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0',
                                    fontSize: '13px',
                                    opacity: 0.8
                                }}
                            >
                                Back to Login / Use different account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

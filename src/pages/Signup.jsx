// src/pages/Signup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ParticleBackground from "../components/ParticleBackground";
import { ROLES } from "../constants/roles";
import "./Login.css"; // Reuse Login.css for consistent styling

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, userRole, emailVerified, signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already logged in
  useEffect(() => {
    if (user && userRole) {
      if (!emailVerified && userRole === ROLES.USER) {
        navigate("/verify-email", { replace: true });
        return;
      }

      if (userRole === ROLES.ADMIN) {
        navigate("/admin/dashboard", { replace: true });
      } else if (userRole === ROLES.AGENT) {
        navigate("/agent/dashboard", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }
  }, [user, userRole, emailVerified, navigate]);

  // Auto-fill invitation code from URL
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setInvitationCode(refCode);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Starting signup process...");
      // Use invitation code if provided, otherwise null
      const referralCode = invitationCode.trim() || null;
      await signup(email, password, referralCode, name);
      console.log("Signup successful, redirecting...");
      // user state change will trigger useEffect redirect
    } catch (err) {
      console.error("Signup error:", err);

      // Show specific error messages
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <ParticleBackground />

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">WayMore Trading</div>
            <h2 className="login-title">Create Account</h2>
            <p className="login-subtitle">Start your trading journey today</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Invitation Code <span style={{ color: '#94a3b8', fontSize: '12px' }}>(Optional)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter invitation code if you have one"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
              />
              {invitationCode && (
                <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                  ✓ You'll be registered under this referral
                </div>
              )}
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    display: 'inline-block',
                    marginRight: '8px'
                  }} />
                  Creating Account...
                </>
              ) : "Create Account"}
            </button>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </form>

          <div className="login-footer">
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

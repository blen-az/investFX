import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ParticleBackground from "../components/ParticleBackground";
import { ROLES } from "../constants/roles";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, userRole, emailVerified, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && userRole) {
      // Allow admins to skip verification check
      if (userRole !== ROLES.ADMIN && !emailVerified) {
        navigate("/verify-email", { replace: true });
        return;
      }

      console.log("Login Redirect Check:", { userRole, isAdmin: userRole === ROLES.ADMIN, isAgent: userRole === ROLES.AGENT });
      if (userRole === ROLES.ADMIN) {
        navigate("/admin/dashboard", { replace: true });
      } else if (userRole === ROLES.AGENT) {
        navigate("/agent/dashboard", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }
  }, [user, userRole, emailVerified, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // user state change will trigger useEffect redirect
    } catch (err) {
      if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError("Failed to login. Please check your credentials.");
      }
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
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Sign in to continue trading</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="forgot-password-link-container" style={{ textAlign: 'right', marginTop: '-15px', marginBottom: '15px' }}>
              <Link to="/forgot-password" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
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
                  Signing in...
                </>
              ) : "Sign In"}
            </button>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </form>

          <div className="login-footer">
            Don't have an account?{" "}
            <Link to="/signup" className="login-link">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

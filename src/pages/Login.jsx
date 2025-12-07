import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ParticleBackground from "../components/ParticleBackground";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/home");
    } catch (err) {
      setError("Failed to login. Please check your credentials.");
    }
  };

  return (
    <div className="login-page">
      <ParticleBackground />

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">AvaTrade</div>
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

            <button type="submit" className="login-btn">
              Sign In
            </button>
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

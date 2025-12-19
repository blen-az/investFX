// src/pages/Support.jsx
import React, { useState } from "react";
import ParticleBackground from "../components/ParticleBackground";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import "./Support.css";

export default function Support() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const ticketData = {
        uid: user?.uid || "anonymous",
        userEmail: user?.email || "anonymous",
        subject,
        message,
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, "tickets"), ticketData);

      setSubmitted(true);
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-page">
      <ParticleBackground />
      <div className="support-container glass-card">
        <div className="support-header">
          <h1>Customer Support</h1>
          <p>We are here to help you 24/7</p>
        </div>

        {submitted ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Message Sent!</h2>
            <p>Our team will get back to you shortly via email.</p>
            <button className="new-ticket-btn" onClick={() => setSubmitted(false)}>
              Open New Ticket
            </button>
          </div>
        ) : (
          <form className="support-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="support-input"
              >
                <option value="">Select a topic...</option>
                <option value="deposit">Deposit Issue</option>
                <option value="withdrawal">Withdrawal Issue</option>
                <option value="trading">Trading Question</option>
                <option value="account">Account Security</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Describe your issue in detail..."
                className="support-textarea"
                rows="6"
              ></textarea>
            </div>

            <button type="submit" className="submit-btn">
              Send Message
            </button>
          </form>
        )}

        <div className="contact-info">
          <div className="contact-item">
            <span className="icon">📧</span>
            <span>support@fortunetrade.com</span>
          </div>
          <div className="contact-item">
            <span className="icon">📞</span>
            <span>+1 (555) 123-4567</span>
          </div>
        </div>
      </div>
    </div>
  );
}

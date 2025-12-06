// src/pages/Verification.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
    getVerificationStatus,
    uploadVerificationDocuments,
    submitVerification
} from "../services/verificationService";
import "./Verification.css";

export default function Verification() {
    const { user } = useAuth();
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [frontPreview, setFrontPreview] = useState(null);
    const [backPreview, setBackPreview] = useState(null);

    useEffect(() => {
        if (user) {
            loadVerificationStatus();
        }
    }, [user]);

    const loadVerificationStatus = async () => {
        try {
            setLoading(true);
            const status = await getVerificationStatus(user.uid);
            setVerificationStatus(status);
        } catch (error) {
            console.error("Error loading verification status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB");
            return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        if (type === "front") {
            setFrontImage(file);
            setFrontPreview(URL.createObjectURL(file));
        } else {
            setBackImage(file);
            setBackPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!frontImage || !backImage) {
            alert("Please upload both front and back images of your ID");
            return;
        }

        try {
            setSubmitting(true);

            // Upload images to Cloudinary
            const { frontUrl, backUrl } = await uploadVerificationDocuments(frontImage, backImage);

            // Submit verification request
            await submitVerification(user.uid, frontUrl, backUrl);

            // Reload status
            await loadVerificationStatus();

            // Clear form
            setFrontImage(null);
            setBackImage(null);
            setFrontPreview(null);
            setBackPreview(null);

            alert("Verification submitted successfully! We'll review it shortly.");
        } catch (error) {
            console.error("Error submitting verification:", error);
            alert("Failed to submit verification. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="verification-page">
                <div className="verification-container glass-card">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading verification status...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="verification-page">
            <div className="verification-container glass-card">
                <div className="verification-header">
                    <h1>Identity Verification</h1>
                    <p>Upload your ID to verify your account</p>
                </div>

                {/* Current Status */}
                <div className={`verification-status-card status-${verificationStatus.status}`}>
                    <div className="status-icon">
                        {verificationStatus.status === "verified" && "✓"}
                        {verificationStatus.status === "pending" && "⏳"}
                        {verificationStatus.status === "rejected" && "✗"}
                        {verificationStatus.status === "unverified" && "○"}
                    </div>
                    <div className="status-info">
                        <h3>
                            {verificationStatus.status === "verified" && "Verified"}
                            {verificationStatus.status === "pending" && "Pending Review"}
                            {verificationStatus.status === "rejected" && "Rejected"}
                            {verificationStatus.status === "unverified" && "Not Verified"}
                        </h3>
                        <p>
                            {verificationStatus.status === "verified" && "Your account is verified"}
                            {verificationStatus.status === "pending" && "Your documents are being reviewed"}
                            {verificationStatus.status === "rejected" && "Your verification was rejected"}
                            {verificationStatus.status === "unverified" && "Please submit your ID documents"}
                        </p>
                        {verificationStatus.status === "rejected" && verificationStatus.rejectionReason && (
                            <div className="rejection-reason">
                                <strong>Reason:</strong> {verificationStatus.rejectionReason}
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Form (only if not verified or pending) */}
                {(verificationStatus.status === "unverified" || verificationStatus.status === "rejected") && (
                    <form className="verification-form" onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h3>Upload ID Documents</h3>
                            <p className="form-hint">
                                Please upload clear photos of the front and back of your government-issued ID
                                (Passport, Driver's License, or National ID)
                            </p>
                        </div>

                        <div className="upload-grid">
                            {/* Front Image */}
                            <div className="upload-box">
                                <label className="upload-label">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageSelect(e, "front")}
                                        className="file-input"
                                    />
                                    {frontPreview ? (
                                        <div className="image-preview">
                                            <img src={frontPreview} alt="ID Front" />
                                            <div className="preview-overlay">
                                                <span>Click to change</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="upload-placeholder">
                                            <div className="upload-icon">📄</div>
                                            <p>ID Front</p>
                                            <span>Click to upload</span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Back Image */}
                            <div className="upload-box">
                                <label className="upload-label">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageSelect(e, "back")}
                                        className="file-input"
                                    />
                                    {backPreview ? (
                                        <div className="image-preview">
                                            <img src={backPreview} alt="ID Back" />
                                            <div className="preview-overlay">
                                                <span>Click to change</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="upload-placeholder">
                                            <div className="upload-icon">📄</div>
                                            <p>ID Back</p>
                                            <span>Click to upload</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="form-footer">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={!frontImage || !backImage || submitting}
                            >
                                {submitting ? "Submitting..." : "Submit for Verification"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Pending State */}
                {verificationStatus.status === "pending" && (
                    <div className="pending-info">
                        <p>
                            Your documents were submitted on{" "}
                            {verificationStatus.submittedAt?.toDate().toLocaleDateString()}
                        </p>
                        <p>We typically review documents within 24-48 hours.</p>
                    </div>
                )}

                {/* Verified State */}
                {verificationStatus.status === "verified" && (
                    <div className="verified-info">
                        <p>
                            Your account was verified on{" "}
                            {verificationStatus.reviewedAt?.toDate().toLocaleDateString()}
                        </p>
                        <p>You now have full access to all platform features.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

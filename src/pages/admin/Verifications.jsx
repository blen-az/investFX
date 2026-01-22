// src/pages/admin/Verifications.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
    getAllVerifications,
    getPendingVerifications,
    approveVerification,
    rejectVerification
} from "../../services/verificationService";
import Modal from "../../components/Modal";
import "./Verifications.css";

export default function Verifications() {
    const { user } = useAuth();
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [selectedVerification, setSelectedVerification] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processing, setProcessing] = useState(false);

    const loadVerifications = React.useCallback(async () => {
        try {
            setLoading(true);
            let data;
            if (filter === "pending") {
                data = await getPendingVerifications();
            } else if (filter === "all") {
                data = await getAllVerifications();
            } else {
                data = await getAllVerifications(filter);
            }
            setVerifications(data);
        } catch (error) {
            console.error("Error loading verifications:", error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadVerifications();
    }, [loadVerifications]);

    const handleApprove = async (userId) => {
        if (!window.confirm("Are you sure you want to approve this verification?")) {
            return;
        }

        try {
            setProcessing(true);
            await approveVerification(userId, user.uid);
            await loadVerifications();
            setSelectedVerification(null);
            alert("Verification approved successfully!");
        } catch (error) {
            console.error("Error approving verification:", error);
            alert("Failed to approve verification. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert("Please provide a reason for rejection");
            return;
        }

        try {
            setProcessing(true);
            await rejectVerification(showRejectModal.userId, user.uid, rejectionReason);
            await loadVerifications();
            setShowRejectModal(null);
            setSelectedVerification(null);
            setRejectionReason("");
            alert("Verification rejected");
        } catch (error) {
            console.error("Error rejecting verification:", error);
            alert("Failed to reject verification. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            verified: { text: "✓ Verified", class: "badge-success" },
            pending: { text: "⏳ Pending", class: "badge-warning" },
            rejected: { text: "✗ Rejected", class: "badge-danger" },
            unverified: { text: "○ Unverified", class: "badge-secondary" }
        };
        const badge = badges[status] || badges.unverified;
        return <span className={`badge ${badge.class}`}>{badge.text}</span>;
    };

    return (
        <div className="verifications-page">
            <div className="page-header">
                <h1>ID Verifications</h1>
                <p>Review and approve user identity documents</p>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === "pending" ? "active" : ""}`}
                    onClick={() => setFilter("pending")}
                >
                    Pending ({verifications.filter(v => v.verification.status === "pending").length})
                </button>
                <button
                    className={`filter-tab ${filter === "verified" ? "active" : ""}`}
                    onClick={() => setFilter("verified")}
                >
                    Verified
                </button>
                <button
                    className={`filter-tab ${filter === "rejected" ? "active" : ""}`}
                    onClick={() => setFilter("rejected")}
                >
                    Rejected
                </button>
                <button
                    className={`filter-tab ${filter === "all" ? "active" : ""}`}
                    onClick={() => setFilter("all")}
                >
                    All
                </button>
            </div>

            {/* Verifications List */}
            <div className="verifications-container glass-card">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading verifications...</p>
                    </div>
                ) : verifications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>No verifications found</h3>
                        <p>There are no {filter !== "all" ? filter : ""} verifications at this time</p>
                    </div>
                ) : (
                    <div className="verifications-list">
                        {verifications.map((verification) => (
                            <div key={verification.userId} className="verification-card">
                                <div className="verification-info">
                                    <div className="user-avatar">
                                        {verification.name?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                    <div className="user-details">
                                        <h3>{verification.name}</h3>
                                        <p>{verification.email}</p>
                                        <div className="verification-meta">
                                            <span>
                                                Submitted:{" "}
                                                {verification.verification.submittedAt?.toDate().toLocaleDateString()}
                                            </span>
                                            {verification.verification.reviewedAt && (
                                                <span>
                                                    Reviewed:{" "}
                                                    {verification.verification.reviewedAt?.toDate().toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="verification-status">
                                    {getStatusBadge(verification.verification.status)}
                                </div>

                                <div className="verification-actions">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setSelectedVerification(verification)}
                                    >
                                        View Documents
                                    </button>
                                    {verification.verification.status === "pending" && (
                                        <>
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => handleApprove(verification.userId)}
                                                disabled={processing}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => setShowRejectModal(verification)}
                                                disabled={processing}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* View Documents Modal */}
            {selectedVerification && (
                <Modal
                    isOpen={true}
                    onClose={() => setSelectedVerification(null)}
                    title={`${selectedVerification.name}'s ID Documents`}
                >
                    <div className="documents-modal">
                        <div className="document-images">
                            <div className="document-image-container">
                                <h4>ID Front</h4>
                                <img
                                    src={selectedVerification.verification.idFrontUrl}
                                    alt="ID Front"
                                    className="document-image"
                                />
                            </div>
                            <div className="document-image-container">
                                <h4>ID Back</h4>
                                <img
                                    src={selectedVerification.verification.idBackUrl}
                                    alt="ID Back"
                                    className="document-image"
                                />
                            </div>
                        </div>

                        {selectedVerification.verification.status === "pending" && (
                            <div className="modal-actions">
                                <button
                                    className="btn btn-success"
                                    onClick={() => handleApprove(selectedVerification.userId)}
                                    disabled={processing}
                                >
                                    {processing ? "Processing..." : "Approve"}
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => {
                                        setShowRejectModal(selectedVerification);
                                        setSelectedVerification(null);
                                    }}
                                    disabled={processing}
                                >
                                    Reject
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedVerification(null)}
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <Modal
                    isOpen={true}
                    onClose={() => {
                        setShowRejectModal(null);
                        setRejectionReason("");
                    }}
                    title="Reject Verification"
                >
                    <div className="reject-modal">
                        <p>Please provide a reason for rejecting this verification:</p>
                        <textarea
                            className="form-input"
                            rows="4"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., Document is blurry, ID is expired, etc."
                        />
                        <div className="modal-actions">
                            <button
                                className="btn btn-danger"
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || processing}
                            >
                                {processing ? "Processing..." : "Confirm Rejection"}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowRejectModal(null);
                                    setRejectionReason("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

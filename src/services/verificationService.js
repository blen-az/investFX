// src/services/verificationService.js
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";

/**
 * Upload verification documents to Cloudinary
 */
export const uploadVerificationDocuments = async (frontImage, backImage) => {
    try {
        const cloudName = "dlzvewiff"; // Updated working cloud name
        const uploadPreset = "invest"; // Updated working upload preset

        const uploadImage = async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error("Image upload failed");
            }

            const data = await response.json();
            return data.secure_url;
        };

        const frontUrl = await uploadImage(frontImage);
        const backUrl = await uploadImage(backImage);

        return { frontUrl, backUrl };
    } catch (error) {
        console.error("Error uploading verification documents:", error);
        throw error;
    }
};

/**
 * Submit verification request
 */
export const submitVerification = async (userId, frontUrl, backUrl) => {
    try {
        const userRef = doc(db, "users", userId);

        await updateDoc(userRef, {
            "verification.status": "pending",
            "verification.idFrontUrl": frontUrl,
            "verification.idBackUrl": backUrl,
            "verification.submittedAt": serverTimestamp(),
            "verification.reviewedAt": null,
            "verification.reviewedBy": null,
            "verification.rejectionReason": null
        });

        return { success: true };
    } catch (error) {
        console.error("Error submitting verification:", error);
        throw error;
    }
};

/**
 * Get verification status for a user
 */
export const getVerificationStatus = async (userId) => {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error("User not found");
        }

        const userData = userDoc.data();

        // Normalize for single user view
        if (!userData.verification && userData.kycStatus) {
            return {
                status: userData.kycStatus,
                idFrontUrl: userData.idUrl,
                idBackUrl: null,
                submittedAt: userData.kycSubmittedAt ? { toDate: () => new Date(userData.kycSubmittedAt) } : null,
                isLegacy: true,
                reviewedAt: null,
                reviewedBy: null,
                rejectionReason: null
            };
        }

        return userData.verification || {
            status: "unverified",
            idFrontUrl: null,
            idBackUrl: null,
            submittedAt: null,
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null
        };
    } catch (error) {
        console.error("Error getting verification status:", error);
        throw error;
    }
};

/**
 * Get all pending verifications (Admin only)
 */
export const getPendingVerifications = async () => {
    try {
        const usersRef = collection(db, "users");
        // Fetch all users to avoid nested field index requirement
        const snapshot = await getDocs(usersRef);
        const verifications = [];

        snapshot.forEach((doc) => {
            const userData = doc.data();

            // Normalize: If legacy fields exist but new 'verification' object doesn't, create one
            let verification = userData.verification;
            if (!verification && userData.kycStatus) {
                verification = {
                    status: userData.kycStatus,
                    idFrontUrl: userData.idUrl, // Legacy was single image
                    idBackUrl: null,
                    submittedAt: userData.kycSubmittedAt ? { toDate: () => new Date(userData.kycSubmittedAt) } : null,
                    isLegacy: true
                };
            }

            // Filter for pending verifications client-side
            if (verification && verification.status === "pending") {
                verifications.push({
                    userId: doc.id,
                    name: userData.name || userData.email,
                    email: userData.email,
                    verification: verification,
                    createdAt: userData.createdAt
                });
            }
        });

        // Sort by submission date (newest first)
        verifications.sort((a, b) => {
            const dateA = a.verification.submittedAt?.toDate() || new Date(0);
            const dateB = b.verification.submittedAt?.toDate() || new Date(0);
            return dateB - dateA;
        });

        return verifications;
    } catch (error) {
        console.error("Error getting pending verifications:", error);
        throw error;
    }
};

/**
 * Get all verifications with optional status filter (Admin only)
 */
export const getAllVerifications = async (statusFilter = null) => {
    try {
        const usersRef = collection(db, "users");
        // Fetch all users to avoid nested field index requirement
        const snapshot = await getDocs(usersRef);
        const verifications = [];

        snapshot.forEach((doc) => {
            const userData = doc.data();

            // Normalize: If legacy fields exist but new 'verification' object doesn't, create one
            let verification = userData.verification;
            if (!verification && userData.kycStatus) {
                verification = {
                    status: userData.kycStatus,
                    idFrontUrl: userData.idUrl, // Legacy was single image
                    idBackUrl: null,
                    submittedAt: userData.kycSubmittedAt ? { toDate: () => new Date(userData.kycSubmittedAt) } : null,
                    isLegacy: true
                };
            }

            // Only include users who have verification data
            if (verification && verification.status !== "unverified") {
                // Apply status filter if provided
                if (!statusFilter || verification.status === statusFilter) {
                    verifications.push({
                        userId: doc.id,
                        name: userData.name || userData.email,
                        email: userData.email,
                        role: userData.role,
                        verification: verification,
                        createdAt: userData.createdAt
                    });
                }
            }
        });

        // Sort by submission date (newest first)
        verifications.sort((a, b) => {
            const dateA = a.verification.submittedAt?.toDate() || new Date(0);
            const dateB = b.verification.submittedAt?.toDate() || new Date(0);
            return dateB - dateA;
        });

        return verifications;
    } catch (error) {
        console.error("Error getting all verifications:", error);
        throw error;
    }
};

/**
 * Approve verification (Admin only)
 */
export const approveVerification = async (userId, adminId) => {
    try {
        const userRef = doc(db, "users", userId);

        await updateDoc(userRef, {
            "verification.status": "verified",
            "verification.reviewedAt": serverTimestamp(),
            "verification.reviewedBy": adminId,
            "verification.rejectionReason": null
        });

        return { success: true };
    } catch (error) {
        console.error("Error approving verification:", error);
        throw error;
    }
};

/**
 * Reject verification (Admin only)
 */
export const rejectVerification = async (userId, adminId, reason) => {
    try {
        const userRef = doc(db, "users", userId);

        await updateDoc(userRef, {
            "verification.status": "rejected",
            "verification.reviewedAt": serverTimestamp(),
            "verification.reviewedBy": adminId,
            "verification.rejectionReason": reason || "Documents did not meet verification requirements"
        });

        return { success: true };
    } catch (error) {
        console.error("Error rejecting verification:", error);
        throw error;
    }
};

// src/services/migrationService.js
// In-app migration function that can be called from admin panel
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Generate a unique 6-character referral code
 */
const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Check if referral code is unique
 */
const isReferralCodeUnique = async (code, existingCodes) => {
    return !existingCodes.includes(code);
};

/**
 * Generate a unique referral code
 */
const generateUniqueReferralCode = async (existingCodes) => {
    let code = generateReferralCode();
    let attempts = 0;

    while (!await isReferralCodeUnique(code, existingCodes) && attempts < 10) {
        code = generateReferralCode();
        attempts++;
    }

    if (attempts >= 10) {
        throw new Error("Failed to generate unique referral code");
    }

    existingCodes.push(code);
    return code;
};

/**
 * Migrate all agents without referral codes
 * Can be called from admin panel
 */
export const migrateAgentReferralCodes = async () => {
    try {
        console.log("Starting agent referral code migration...");

        // Get all users
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        // Get all existing referral codes
        const existingCodes = [];
        const allUsers = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            allUsers[doc.id] = { ...data, id: doc.id };
            if (data.referralCode) {
                existingCodes.push(data.referralCode);
            }
        });

        // Find agents without referral codes
        const agentsToUpdate = Object.values(allUsers).filter(
            user => user.role === "agent" && !user.referralCode
        );

        if (agentsToUpdate.length === 0) {
            return {
                success: true,
                message: "All agents already have referral codes",
                updated: 0,
                total: 0
            };
        }

        // Generate and assign codes
        let successCount = 0;
        let errors = [];

        for (const agent of agentsToUpdate) {
            try {
                const code = await generateUniqueReferralCode(existingCodes);
                const userRef = doc(db, "users", agent.id);

                await updateDoc(userRef, {
                    referralCode: code,
                    updatedAt: new Date()
                });

                console.log(`Assigned code ${code} to ${agent.email}`);
                successCount++;
            } catch (error) {
                console.error(`Failed to update ${agent.email}:`, error.message);
                errors.push({
                    email: agent.email,
                    error: error.message
                });
            }
        }

        return {
            success: errors.length === 0,
            message: `Migration completed: ${successCount} agents updated`,
            updated: successCount,
            failed: errors.length,
            total: agentsToUpdate.length,
            errors
        };

    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    }
};

/**
 * Get migration status (how many agents need codes)
 */
export const getMigrationStatus = async () => {
    try {
        const usersRef = collection(db, "users");
        const agentsQuery = query(usersRef, where("role", "==", "agent"));
        const snapshot = await getDocs(agentsQuery);

        let totalAgents = 0;
        let agentsWithCodes = 0;
        let agentsWithoutCodes = 0;

        snapshot.forEach(doc => {
            totalAgents++;
            if (doc.data().referralCode) {
                agentsWithCodes++;
            } else {
                agentsWithoutCodes++;
            }
        });

        return {
            totalAgents,
            agentsWithCodes,
            agentsWithoutCodes,
            needsMigration: agentsWithoutCodes > 0
        };
    } catch (error) {
        console.error("Error getting migration status:", error);
        throw error;
    }
};

/**
 * Generate a unique 8-character alphanumeric Short ID (copy from authService logic)
 */
const generateShortId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let autoId = "";
    for (let i = 0; i < 8; i++) {
        autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
};

const isShortIdUnique = async (shortId, existingIds) => {
    return !existingIds.includes(shortId);
};

const generateUniqueShortId = async (existingIds) => {
    let id = generateShortId();
    let attempts = 0;
    while (!await isShortIdUnique(id, existingIds) && attempts < 10) {
        id = generateShortId();
        attempts++;
    }
    if (attempts >= 10) return generateShortId() + Date.now().toString().slice(-4);
    existingIds.push(id);
    return id;
};

/**
 * Migrate all users without shortId
 */
export const migrateShortIds = async () => {
    try {
        console.log("Starting Short ID migration...");
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        const existingIds = [];
        const usersToUpdate = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.shortId) existingIds.push(data.shortId);
            else usersToUpdate.push({ id: doc.id, email: data.email });
        });

        if (usersToUpdate.length === 0) {
            return { success: true, message: "All users already have Short IDs" };
        }

        let successCount = 0;
        let errors = [];

        for (const user of usersToUpdate) {
            try {
                const shortId = await generateUniqueShortId(existingIds);
                const userRef = doc(db, "users", user.id);
                await updateDoc(userRef, { shortId, updatedAt: new Date() });
                successCount++;
            } catch (err) {
                console.error(`Failed to update ${user.email}:`, err);
                errors.push({ email: user.email, error: err.message });
            }
        }

        return {
            success: errors.length === 0,
            message: `Migration completed: ${successCount} users updated`,
            updated: successCount,
            failed: errors.length,
            errors
        };
    } catch (error) {
        console.error("Error migrating Short IDs:", error);
        throw error;
    }
};

/**
 * Get status for Short ID migration
 */
export const getShortIdMigrationStatus = async () => {
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        let missing = 0;
        snapshot.forEach(doc => {
            if (!doc.data().shortId) missing++;
        });
        return { needsMigration: missing > 0, missingCount: missing };
    } catch (error) {
        console.error("Error getting Short ID status:", error);
        throw error;
    }
};

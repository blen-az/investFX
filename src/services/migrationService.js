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

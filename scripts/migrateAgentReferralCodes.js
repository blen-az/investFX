// scripts/migrateAgentReferralCodes.js
// Run this script once to assign referral codes to all existing agents who don't have one

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";

// Your Firebase configuration (copy from src/firebase.js)
const firebaseConfig = {
    // Add your Firebase config here
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
 * Main migration function
 */
async function migrateAgentReferralCodes() {
    console.log("🚀 Starting agent referral code migration...\n");

    try {
        // Get all users
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        // Get all existing referral codes
        const existingCodes = [];
        snapshot.forEach(doc => {
            const code = doc.data().referralCode;
            if (code) existingCodes.push(code);
        });

        console.log(`📊 Found ${existingCodes.length} existing referral codes\n`);

        // Find agents without referral codes
        const agentsToUpdate = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.role === "agent" && !data.referralCode) {
                agentsToUpdate.push({
                    id: doc.id,
                    email: data.email,
                    name: data.name
                });
            }
        });

        if (agentsToUpdate.length === 0) {
            console.log("✅ All agents already have referral codes!");
            return;
        }

        console.log(`🔍 Found ${agentsToUpdate.length} agents without referral codes:`);
        agentsToUpdate.forEach((agent, index) => {
            console.log(`   ${index + 1}. ${agent.name || agent.email}`);
        });
        console.log("");

        // Generate and assign codes
        let successCount = 0;
        let errorCount = 0;

        for (const agent of agentsToUpdate) {
            try {
                const code = await generateUniqueReferralCode(existingCodes);
                const userRef = doc(db, "users", agent.id);

                await updateDoc(userRef, {
                    referralCode: code,
                    updatedAt: new Date()
                });

                console.log(`✅ Assigned code ${code} to ${agent.name || agent.email}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to update ${agent.email}:`, error.message);
                errorCount++;
            }
        }

        console.log("\n" + "=".repeat(50));
        console.log("📈 Migration Summary:");
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${errorCount}`);
        console.log(`   📊 Total: ${agentsToUpdate.length}`);
        console.log("=".repeat(50));

    } catch (error) {
        console.error("❌ Migration failed:", error);
        throw error;
    }
}

// Run the migration
migrateAgentReferralCodes()
    .then(() => {
        console.log("\n🎉 Migration completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Migration failed:", error);
        process.exit(1);
    });

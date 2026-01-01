// src/services/authService.js
import emailjs from '@emailjs/browser';
import { auth, db } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "firebase/auth";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    serverTimestamp,
    orderBy,
    limit
} from "firebase/firestore";

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to user via Firestore trigger email
 */

// EMAILJS CONFIGURATION
// TODO: Replace these with your actual EmailJS keys
const EMAILJS_SERVICE_ID = "service_6hrbkob";
const EMAILJS_TEMPLATE_ID = "template_zjl7ocl";
const EMAILJS_PUBLIC_KEY = "gfUrTaA1o-GWaLHrj";

/**
 * Send OTP to user via EmailJS
 */
export const sendOTP = async (uid, email, name) => {
    try {
        const code = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes expiry

        // 1. Store the code for verification
        // First delete any existing codes for this user to avoid confusion
        const existingCodesQuery = query(
            collection(db, "verificationCodes"),
            where("uid", "==", uid)
        );
        const existingDocs = await getDocs(existingCodesQuery);
        for (const codeDoc of existingDocs.docs) {
            await deleteDoc(doc(db, "verificationCodes", codeDoc.id));
        }

        await addDoc(collection(db, "verificationCodes"), {
            uid,
            email,
            code,
            expiresAt,
            createdAt: serverTimestamp()
        });

        // 2. Trigger the email via EmailJS
        if (EMAILJS_SERVICE_ID === "service_id" && process.env.NODE_ENV === 'development') {
            console.warn("⚠️ EmailJS keys not configured. OTP not sent via email.");
            console.log(`[DEV MODE] OTP for ${email}: ${code}`);
            return { success: true, expiresAt };
        }

        const templateParams = {
            to_email: email,
            to_name: name || email.split('@')[0],
            otp_code: code,
            company_name: "AvaTrade" // Customize as needed
        };

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        console.log(`OTP sent to ${email}`);
        return { success: true, expiresAt };
    } catch (error) {
        console.error("Error sending OTP:", error);
        // Log detailed EmailJS error if available
        if (error.text) {
            console.error("EmailJS Error Details:", error.text);
        }
        throw error;
    }
};

/**
 * Verify the OTP entered by user
 */
export const verifyOTP = async (uid, code) => {
    try {
        const q = query(
            collection(db, "verificationCodes"),
            where("uid", "==", uid),
            where("code", "==", code.trim()),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, message: "Invalid verification code" };
        }

        const data = snapshot.docs[0].data();
        const now = new Date();
        const expiresAt = data.expiresAt.toDate();

        if (now > expiresAt) {
            return { success: false, message: "Verification code has expired" };
        }

        // Mark user as verified in their document
        // Use setDoc with merge: true instead of updateDoc in case the document 
        // wasn't created during signup due to a network glitch (resilient signup)
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
            emailVerified: true,
            email: data.email, // Ensure email is present if doc is new
            updatedAt: serverTimestamp()
        }, { merge: true });

        // Clean up: delete the code
        await deleteDoc(doc(db, "verificationCodes", snapshot.docs[0].id));

        return { success: true };
    } catch (error) {
        console.error("Error verifying OTP:", error);
        throw error;
    }
};

/**
 * Generate a unique 6-character referral code
 */
const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Check if referral code is unique
 */
const isReferralCodeUnique = async (code) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("referralCode", "==", code));
    const snapshot = await getDocs(q);
    return snapshot.empty;
};

/**
 * Generate a unique referral code (retry until unique)
 */
export const generateUniqueReferralCode = async () => {
    let code = generateReferralCode();
    let attempts = 0;

    while (!(await isReferralCodeUnique(code)) && attempts < 10) {
        code = generateReferralCode();
        attempts++;
    }

    if (attempts >= 10) {
        throw new Error("Failed to generate unique referral code");
    }

    return code;
};


/**
 * Create a user document in Firestore
 */
export const createUserDocument = async (uid, email, name, role = "user", referralCode = null, emailVerified = false) => {
    try {
        const userRef = doc(db, "users", uid);

        const userData = {
            uid,
            email,
            name: name || email.split("@")[0],
            role,
            createdAt: new Date(),
            frozen: false,
            emailVerified: emailVerified
        };

        // Add referral code for agents
        if (role === "agent" && !referralCode) {
            userData.referralCode = await generateUniqueReferralCode();
        } else if (referralCode) {
            userData.referralCode = referralCode;
        }

        await setDoc(userRef, userData);

        // Also create wallet for the user
        const walletRef = doc(db, "wallets", uid);
        await setDoc(walletRef, {
            balance: 0,
            commissionBalance: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return { success: true, referralCode: userData.referralCode };
    } catch (error) {
        console.error("Error creating user document:", error);
        throw error;
    }
};

/**
 * Set or update a user's role (admin use only)
 */
export const setUserRole = async (uid, role) => {
    // ...existing code...
    try {
        // Validate role
        const validRoles = ["user", "admin", "agent"];
        if (!validRoles.includes(role)) {
            throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
        }

        const userRef = doc(db, "users", uid);

        // Check if user exists
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            throw new Error("User not found");
        }

        const updateData = {
            role,
            updatedAt: new Date()
        };

        // Generate referral code if upgrading to agent and doesn't have one
        if (role === "agent") {
            if (!userSnap.data().referralCode) {
                try {
                    updateData.referralCode = await generateUniqueReferralCode();
                } catch (err) {
                    console.warn("Error generating referral code during upgrade:", err);
                    // Allow upgrade to proceed, code can be generated later or manually
                }
            }

            // Ensure wallet has commissionBalance
            const walletRef = doc(db, "wallets", uid);
            const walletSnap = await getDoc(walletRef);

            if (walletSnap.exists()) {
                await setDoc(walletRef, {
                    commissionBalance: walletSnap.data().commissionBalance || 0
                }, { merge: true });
            } else {
                // Create wallet if missing
                await setDoc(walletRef, {
                    balance: 0,
                    commissionBalance: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        await updateDoc(userRef, updateData);

        return { success: true, role, referralCode: updateData.referralCode };
    } catch (error) {
        console.error("Error setting user role:", error);
        throw error;
    }
    // ...existing code...
};

/**
 * Create an agent account (admin use only)
 */
export const createAgent = async (email, password, name) => {
    let secondaryApp = null;
    const appName = `SecondaryApp-${Date.now()}`;

    try {
        // Validate inputs
        if (!email || !password) {
            throw new Error("Email and password are required");
        }

        if (password.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        // Check if user already exists
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const existingUsers = await getDocs(q);

        if (!existingUsers.empty) {
            throw new Error("An account with this email already exists");
        }

        // DYNAMICALY IMPORT to avoid circular deps or init issues
        const { initializeApp, getApps, getApp, deleteApp } = await import("firebase/app");
        const { getAuth: getSecondaryAuth, createUserWithEmailAndPassword: createSecondaryUser } = await import("firebase/auth");

        // Initialize a secondary app instance to avoid logging out the admin
        const firebaseConfig = {
            apiKey: "AIzaSyDTdhyBMYdpOy3a7SDYHyXmFJPgD5Ao7nA",
            authDomain: "investfx-1faf1.firebaseapp.com",
            projectId: "investfx-1faf1",
            storageBucket: "investfx-1faf1.firebasestorage.app",
            messagingSenderId: "310036681524",
            appId: "1:310036681524:web:7937a954a237d15c030b61"
        };

        // Ensure we don't have a lingering app with the same name (though we use unique names now)
        if (getApps().length > 0) {
            const existingApp = getApps().find(app => app.name === appName);
            if (existingApp) {
                await deleteApp(existingApp);
            }
        }

        secondaryApp = initializeApp(firebaseConfig, appName);
        const secondaryAuth = getSecondaryAuth(secondaryApp);

        // Create Firebase Auth account on the secondary app
        const userCredential = await createSecondaryUser(secondaryAuth, email, password);
        const uid = userCredential.user.uid;

        // Force sign out from the secondary app to be safe
        await secondaryAuth.signOut();

        // Create user document with "agent" role using the MAIN db connection (admin permissions)
        await createUserDocument(uid, email, name, "agent", null, true);

        return {
            success: true,
            uid,
            email,
            message: "Agent account created successfully"
        };
    } catch (error) {
        console.error("Error creating agent:", error);

        if (error.code === "auth/email-already-in-use") {
            throw new Error("This email is already in use");
        } else if (error.code === "auth/invalid-email") {
            throw new Error("Invalid email address");
        } else if (error.code === "auth/weak-password") {
            throw new Error("Password is too weak");
        }

        throw error;
    } finally {
        // Cleanup the secondary app
        if (secondaryApp) {
            try {
                const { deleteApp } = await import("firebase/app");
                await deleteApp(secondaryApp);
            } catch (cleanupError) {
                console.warn("Failed to cleanup secondary app:", cleanupError);
            }
        }
    }
};

/**
 * Get user role by UID
 */
export const getUserRole = async (uid) => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return null;
        }

        return userSnap.data().role || "user";
    } catch (error) {
        console.error("Error getting user role:", error);
        throw error;
    }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: "Password reset email sent" };
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    }
};

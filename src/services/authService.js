// src/services/authService.js
import { auth, db } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";
import {
    doc,
    setDoc,
    updateDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";

/**
 * Create a user document in Firestore
 */
export const createUserDocument = async (uid, email, name, role = "user") => {
    try {
        const userRef = doc(db, "users", uid);

        await setDoc(userRef, {
            uid,
            email,
            name: name || email.split("@")[0],
            role,
            createdAt: new Date(),
            frozen: false
        });

        // Also create wallet for the user
        const walletRef = doc(db, "wallets", uid);
        await setDoc(walletRef, {
            balance: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        console.error("Error creating user document:", error);
        throw error;
    }
};

/**
 * Set or update a user's role (admin use only)
 */
export const setUserRole = async (uid, role) => {
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

        await updateDoc(userRef, {
            role,
            updatedAt: new Date()
        });

        return { success: true, role };
    } catch (error) {
        console.error("Error setting user role:", error);
        throw error;
    }
};

/**
 * Create an agent account (admin use only)
 */
export const createAgent = async (email, password, name) => {
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

        // Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Create user document with "agent" role
        await createUserDocument(uid, email, name, "agent");

        // Sign out the newly created user (so admin stays logged in)
        await auth.signOut();

        return {
            success: true,
            uid,
            email,
            message: "Agent account created successfully"
        };
    } catch (error) {
        console.error("Error creating agent:", error);

        // Provide user-friendly error messages
        if (error.code === "auth/email-already-in-use") {
            throw new Error("This email is already in use");
        } else if (error.code === "auth/invalid-email") {
            throw new Error("Invalid email address");
        } else if (error.code === "auth/weak-password") {
            throw new Error("Password is too weak");
        }

        throw error;
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

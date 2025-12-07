// src/contexts/AuthContext.jsx - Enhanced with better error handling
import React, { useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ROLES } from "../constants/roles";

const AuthContext = React.createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role from Firestore
  const fetchUserRole = async (uid) => {
    try {
      console.log(`Fetching role for user: ${uid}`);
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role || ROLES.USER;
        console.log(`User role: ${role}`);
        return role;
      }
      console.log('User document does not exist, defaulting to USER role');
      return ROLES.USER;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return ROLES.USER;
    }
  };

  // Listen for login/logout changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? currentUser.email : 'No user');

      if (currentUser) {
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Attach displayName to user object
            currentUser.displayName = userData.name || currentUser.email.split('@')[0];
            console.log('User displayName:', currentUser.displayName);
            setUserRole(userData.role || ROLES.USER);
          } else {
            const role = await fetchUserRole(currentUser.uid);
            setUserRole(role);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          const role = await fetchUserRole(currentUser.uid);
          setUserRole(role);
        }
      } else {
        setUserRole(null);
      }

      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // SIGN UP
  async function signup(email, password, referralCode = null, name = "") {
    try {
      console.log('Step 1: Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log(`✅ Auth user created: ${user.uid}`);

      console.log('Step 2: Creating Firestore user document...');
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: name || email.split('@')[0], // Use provided name or email username
        role: ROLES.USER,
        kycStatus: "unverified", // Default to unverified
        referredBy: referralCode || null,
        frozen: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ User document created');

      console.log('Step 3: Creating wallet document...');
      await setDoc(doc(db, "wallets", user.uid), {
        uid: user.uid,
        balance: 0,
        commissionBalance: 0,
        updatedAt: new Date()
      });
      console.log('✅ Wallet document created');

      setUserRole(ROLES.USER);
      console.log('✅ Signup complete!');
      return userCredential;
    } catch (error) {
      console.error('❌ Signup failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  }

  // LOGIN
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // LOGOUT
  function logout() {
    setUserRole(null);
    return signOut(auth);
  }

  // Role check helpers
  const isAdmin = () => userRole === ROLES.ADMIN;
  const isAgent = () => userRole === ROLES.AGENT;
  const isUser = () => userRole === ROLES.USER;

  const value = {
    user,
    userRole,
    loading,
    signup,
    login,
    logout,
    isAdmin,
    isAgent,
    isUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

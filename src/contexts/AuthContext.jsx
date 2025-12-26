// src/contexts/AuthContext.jsx - Enhanced with better error handling
import React, { useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, query, collection, where, getDocs, limit } from "firebase/firestore";
import { ROLES } from "../constants/roles";
import { sendOTP, verifyOTP } from "../services/authService";

const AuthContext = React.createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
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
    let unsubscribeUserDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? currentUser.email : 'No user');

      if (currentUser) {
        // Subscribe to real-time user document updates
        unsubscribeUserDoc = onSnapshot(doc(db, "users", currentUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Important: We update the state with a new object to trigger re-renders
            setUser({
              ...currentUser,
              displayName: userData.name || currentUser.email.split('@')[0],
              // Add other useful fields from DB to the user state if needed
              phoneNumber: userData.phone || null
            });
            setUserRole(userData.role || ROLES.USER);
            setEmailVerified(userData.emailVerified || false);
            console.log('User data updated from Firestore:', userData.name);
          } else {
            console.log('User document does not exist, using auth defaults');
            setUser(currentUser);
            setUserRole(ROLES.USER);
            setEmailVerified(false);
          }
        }, (error) => {
          console.error("Error listening to user doc:", error);
          setUser(currentUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserRole(null);
        setEmailVerified(false);
        if (unsubscribeUserDoc) unsubscribeUserDoc();
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  // SIGN UP
  async function signup(email, password, referralCode = null, name = "") {
    try {
      console.log('Step 1: Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log(`✅ Auth user created: ${user.uid}`);

      console.log('Step 2: Resolving referral code if provided...');
      let referrerId = null;
      if (referralCode) {
        try {
          const agentsQuery = query(
            collection(db, "users"),
            where("referralCode", "==", referralCode.toUpperCase()),
            limit(1)
          );
          const agentSnapshot = await getDocs(agentsQuery);
          if (!agentSnapshot.empty) {
            referrerId = agentSnapshot.docs[0].id;
            console.log(`✅ Resolved referral code ${referralCode} to UID: ${referrerId}`);
          } else {
            console.warn(`⚠️ Invalid referral code provided: ${referralCode}`);
          }
        } catch (err) {
          console.error("Error resolving referral code:", err);
        }
      }

      console.log('Step 3: Creating Firestore user document...');
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: name || email.split('@')[0],
        role: ROLES.USER,
        kycStatus: "unverified",
        verification: {
          status: "unverified",
          submittedAt: null,
          idFrontUrl: null,
          idBackUrl: null
        },
        referredBy: referrerId, // Now correctly stores the agent's UID
        referralCodeUsed: referralCode || null,
        frozen: false,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ User document created');

      console.log('Step 3.5: Sending initial OTP...');
      await sendOTP(user.uid, email, name || email.split('@')[0]);
      console.log('✅ Initial OTP sent');

      console.log('Step 4: Creating wallet document...');
      await setDoc(doc(db, "wallets", user.uid), {
        uid: user.uid,
        balance: 0,           // Legacy
        mainBalance: 0,      // New schema
        tradingBalance: 0,   // New schema
        commissionBalance: 0,
        assets: {
          USDT: {
            name: "Tether",
            symbol: "USDT",
            total: 0,
            networks: {
              "TRC20": 0,
              "ERC20": 0,
              "BEP20": 0
            }
          },
          BTC: {
            name: "Bitcoin",
            symbol: "BTC",
            total: 0,
            networks: {
              "Bitcoin": 0
            }
          },
          ETH: {
            name: "Ethereum",
            symbol: "ETH",
            total: 0,
            networks: {
              "Ethereum": 0,
              "Arbitrum": 0,
              "Optimism": 0
            }
          },
          SOL: {
            name: "Solana",
            symbol: "SOL",
            total: 0,
            networks: {
              "Solana": 0
            }
          }
        },
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
    setEmailVerified(false);
    return signOut(auth);
  }

  // VERIFY EMAIL OTP
  async function verifyEmailOTP(code) {
    if (!user) throw new Error("No user logged in");
    const result = await verifyOTP(user.uid, code);
    if (result.success) {
      setEmailVerified(true);
      // Also update local user document in state if needed
    }
    return result;
  }

  // RESEND OTP
  async function resendOTP() {
    if (!user) throw new Error("No user logged in");
    return await sendOTP(user.uid, user.email, user.displayName);
  }

  // Role check helpers
  const isAdmin = () => userRole === ROLES.ADMIN;
  const isAgent = () => userRole === ROLES.AGENT;
  const isUser = () => userRole === ROLES.USER;

  const value = {
    user,
    userRole,
    emailVerified,
    loading,
    signup,
    login,
    logout,
    verifyEmailOTP,
    resendOTP,
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

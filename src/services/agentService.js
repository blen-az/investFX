// src/services/agentService.js
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

// Get agent dashboard statistics
export const getAgentStats = async () => {
    try {
        const getStats = httpsCallable(functions, "getAgentStats");
        const result = await getStats();
        return result.data;
    } catch (error) {
        console.error("Error fetching agent stats:", error);
        throw error;
    }
};

// Get list of referred users
export const getReferredUsers = async () => {
    try {
        const getUsers = httpsCallable(functions, "getReferredUsers");
        const result = await getUsers();
        return result.data;
    } catch (error) {
        console.error("Error fetching referred users:", error);
        throw error;
    }
};

// Request commission withdrawal
export const withdrawCommission = async (amount) => {
    try {
        const withdraw = httpsCallable(functions, "withdrawCommission");
        const result = await withdraw({ amount });
        return result.data;
    } catch (error) {
        console.error("Error withdrawing commission:", error);
        throw error;
    }
};

// Get commission history
export const getCommissionHistory = async (agentId) => {
    try {
        const commissionsRef = collection(db, "commissions", agentId, "history");
        const q = query(commissionsRef, orderBy("createdAt", "desc"), limit(50));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
        }));
    } catch (error) {
        console.error("Error fetching commission history:", error);
        throw error;
    }
};

// Generate referral link
export const generateReferralLink = (agentId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup?ref=${agentId}`;
};

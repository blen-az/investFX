// src/services/chatService.js
import { db } from "../firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    increment
} from "firebase/firestore";

/**
 * Get or create a chat between a user and their agent
 */
export const getOrCreateChat = async (userId, agentId) => {
    try {
        // Check if chat already exists
        // Simplified query to avoid composite index requirement (userId + agentId)
        const chatsRef = collection(db, "chats");
        const q = query(
            chatsRef,
            where("userId", "==", userId)
        );

        const snapshot = await getDocs(q);
        const existingChat = snapshot.docs.find(d => d.data().agentId === agentId);

        if (existingChat) {
            // Chat exists, return it
            return {
                id: existingChat.id,
                ...existingChat.data()
            };
        }

        // Create new chat
        const newChat = {
            userId,
            agentId,
            lastMessage: "",
            lastMessageTime: serverTimestamp(),
            unreadCount: {
                user: 0,
                agent: 0
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const chatDoc = await addDoc(chatsRef, newChat);

        return {
            id: chatDoc.id,
            ...newChat
        };
    } catch (error) {
        console.error("Error getting/creating chat:", error);
        throw error;
    }
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (chatId, senderId, senderRole, text) => {
    try {
        // Add message to subcollection
        const messagesRef = collection(db, "chats", chatId, "messages");
        await addDoc(messagesRef, {
            text,
            senderId,
            senderRole,
            createdAt: serverTimestamp(),
            read: false
        });

        // Update chat metadata
        const chatRef = doc(db, "chats", chatId);
        const updateData = {
            lastMessage: text,
            lastMessageTime: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Increment unread count for the receiver
        if (senderRole === "user") {
            updateData["unreadCount.agent"] = increment(1);
        } else {
            updateData["unreadCount.user"] = increment(1);
        }

        await updateDoc(chatRef, updateData);

        return { success: true };
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

/**
 * Get messages for a chat (real-time listener)
 */
export const subscribeToMessages = (chatId, callback) => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
        }));
        callback(messages);
    });
};

/**
 * Get user's chat with their agent
 */
export const getUserChat = async (userId) => {
    try {
        console.log("📞 getUserChat called for userId:", userId);

        // First get the user's referredBy (agent ID)
        const userDoc = await getDoc(doc(db, "users", userId));
        console.log("User doc exists:", userDoc.exists());

        if (!userDoc.exists()) {
            throw new Error("User not found");
        }

        const userData = userDoc.data();
        console.log("User data:", userData);

        const agentId = userData.referredBy;
        console.log("Agent ID from referredBy:", agentId);

        if (!agentId) {
            console.log("❌ No agent assigned to this user");
            return null; // User has no assigned agent
        }

        // Get or create the chat
        console.log("✅ Getting or creating chat between user and agent");
        const chat = await getOrCreateChat(userId, agentId);
        console.log("Chat result:", chat);
        return chat;
    } catch (error) {
        console.error("❌ Error in getUserChat:", error);
        console.error("Error code:", error.code);
        throw error;
    }
};

/**
 * Get all chats for an agent
 */
export const getAgentChats = async (agentId) => {
    try {
        const chatsRef = collection(db, "chats");
        // Simplified query to avoid composite index requirement (agentId + lastMessageTime)
        const q = query(
            chatsRef,
            where("agentId", "==", agentId)
        );

        const snapshot = await getDocs(q);
        const chats = [];

        for (const chatDoc of snapshot.docs) {
            const chatData = chatDoc.data();

            // Get user details
            const userDoc = await getDoc(doc(db, "users", chatData.userId));
            const userData = userDoc.exists() ? userDoc.data() : {};

            chats.push({
                id: chatDoc.id,
                ...chatData,
                userName: userData.name || userData.email || "Unknown User",
                userEmail: userData.email,
                lastMessageTime: chatData.lastMessageTime?.toDate()
            });
        }

        // Sort in memory
        return chats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
    } catch (error) {
        console.error("Error getting agent chats:", error);
        throw error;
    }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (chatId, userRole) => {
    try {
        const chatRef = doc(db, "chats", chatId);
        const updateData = {};

        if (userRole === "user") {
            updateData["unreadCount.user"] = 0;
        } else {
            updateData["unreadCount.agent"] = 0;
        }

        await updateDoc(chatRef, updateData);

        return { success: true };
    } catch (error) {
        console.error("Error marking as read:", error);
        throw error;
    }
};

/**
 * Subscribe to chat updates (for real-time chat list)
 */
export const subscribeToAgentChats = (agentId, callback) => {
    const chatsRef = collection(db, "chats");
    // Simplified query to avoid composite index requirement (agentId + lastMessageTime)
    const q = query(
        chatsRef,
        where("agentId", "==", agentId)
    );

    return onSnapshot(q, async (snapshot) => {
        const chats = [];

        for (const chatDoc of snapshot.docs) {
            const chatData = chatDoc.data();

            // Get user details
            try {
                const userDoc = await getDoc(doc(db, "users", chatData.userId));
                const userData = userDoc.exists() ? userDoc.data() : {};

                chats.push({
                    id: chatDoc.id,
                    ...chatData,
                    userName: userData.name || userData.email || "Unknown User",
                    userEmail: userData.email,
                    lastMessageTime: chatData.lastMessageTime?.toDate()
                });
            } catch (err) {
                console.error("Error fetching user for chat:", err);
            }
        }

        // Sort in memory
        chats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

        callback(chats);
    });
};

/**
 * Initiate a chat from agent side with a referred user
 */
export const initiateAgentChat = async (agentId, userId) => {
    try {
        // Get or create the chat
        const chat = await getOrCreateChat(userId, agentId);

        // Get user details to return with chat
        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.exists() ? userDoc.data() : {};

        return {
            ...chat,
            userName: userData.name || userData.email || "Unknown User",
            userEmail: userData.email
        };
    } catch (error) {
        console.error("Error initiating agent chat:", error);
        throw error;
    }
};


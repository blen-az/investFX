// src/pages/LiveChat.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserChat, sendMessage, subscribeToMessages, markAsRead } from "../services/chatService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./LiveChat.css";

export default function LiveChat() {
    console.log("🔵 LiveChat component rendered");

    const { user: currentUser } = useAuth();
    console.log("🔵 Current user:", currentUser);

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [chat, setChat] = useState(null);
    const [agentInfo, setAgentInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const unsubscribeRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        console.log("🔵 useEffect triggered, currentUser:", currentUser);
        if (!currentUser) {
            console.log("⚠️ No current user, exiting useEffect");
            return;
        }

        const initializeChat = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get user's chat
                const userChat = await getUserChat(currentUser.uid);

                if (!userChat) {
                    setError("no_agent");
                    setLoading(false);
                    return;
                }

                setChat(userChat);

                // Get agent info
                const agentDoc = await getDoc(doc(db, "users", userChat.agentId));
                if (agentDoc.exists()) {
                    setAgentInfo({
                        id: agentDoc.id,
                        ...agentDoc.data()
                    });
                }

                // Subscribe to messages
                unsubscribeRef.current = subscribeToMessages(userChat.id, (msgs) => {
                    setMessages(msgs);
                });

                // Mark messages as read
                await markAsRead(userChat.id, "user");

                setLoading(false);
            } catch (err) {
                console.error("❌ Error initializing chat:", err);
                console.error("Error code:", err.code);
                console.error("Error message:", err.message);

                // Check if it's a permission error
                if (err.code === 'permission-denied') {
                    console.error("🔒 PERMISSION DENIED - Firestore security rules need to be updated!");
                    alert("Chat Error: Permission denied. Please update Firestore security rules.");
                }

                setError("error");
                setLoading(false);
            }
        };

        initializeChat();

        // Cleanup
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [currentUser]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !chat) return;

        try {
            await sendMessage(chat.id, currentUser.uid, "user", inputText);
            setInputText("");
        } catch (err) {
            console.error("Error sending message:", err);
            alert("Failed to send message. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="live-chat-page">
                <div className="chat-container glass-card">
                    <div className="chat-loading">
                        <div className="spinner"></div>
                        <p>Loading chat...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error === "no_agent") {
        return (
            <div className="live-chat-page">
                <div className="chat-container glass-card">
                    <div className="chat-error">
                        <div className="error-icon">👤</div>
                        <h2>No Agent Assigned</h2>
                        <p>You don't have an agent assigned yet.</p>
                        <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>
                            Please contact the administrator to assign you an agent.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error === "error") {
        return (
            <div className="live-chat-page">
                <div className="chat-container glass-card">
                    <div className="chat-error">
                        <div className="error-icon">⚠️</div>
                        <h2>Error Loading Chat</h2>
                        <p>Something went wrong. Please try refreshing the page.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="live-chat-page">
            <div className="chat-container glass-card">
                <div className="chat-header">
                    <div className="agent-avatar">
                        <div className="avatar-img">👩‍💼</div>
                        <div className="online-status"></div>
                    </div>
                    <div className="header-info">
                        <h2>{agentInfo?.name || agentInfo?.email || "Your Agent"}</h2>
                        <span className="status-text">Online • Your assigned agent</span>
                    </div>
                </div>

                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="empty-chat">
                            <div className="empty-icon">💬</div>
                            <p>No messages yet</p>
                            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                                Start a conversation with your agent
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`message ${msg.senderRole}`}>
                                <div className="message-bubble">
                                    {msg.text}
                                </div>
                                <div className="message-time">
                                    {msg.createdAt ? msg.createdAt.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : ''}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your message..."
                        className="chat-input"
                    />
                    <button type="submit" className="send-btn" disabled={!inputText.trim()}>
                        ➤
                    </button>
                </form>
            </div>
        </div>
    );
}

// src/pages/agent/AgentChats.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToAgentChats, sendMessage, subscribeToMessages, markAsRead } from "../../services/chatService";
import "./AgentChats.css";

export default function AgentChats() {
    console.log("🟢 AgentChats component rendered");

    const { user: currentUser } = useAuth();
    console.log("🟢 Current user (agent):", currentUser);

    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const unsubscribeChatsRef = useRef(null);
    const unsubscribeMessagesRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        console.log("🟢 useEffect triggered, currentUser:", currentUser);
        if (!currentUser) {
            console.log("⚠️ No current user, exiting useEffect");
            return;
        }

        console.log("🟢 Subscribing to agent chats for agentId:", currentUser.uid);

        // Subscribe to agent's chats
        unsubscribeChatsRef.current = subscribeToAgentChats(currentUser.uid, (chatList) => {
            console.log("🟢 Received chat list:", chatList);
            setChats(chatList);
            setLoading(false);
        });

        return () => {
            if (unsubscribeChatsRef.current) {
                unsubscribeChatsRef.current();
            }
            if (unsubscribeMessagesRef.current) {
                unsubscribeMessagesRef.current();
            }
        };
    }, [currentUser]);

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);

        // Unsubscribe from previous messages
        if (unsubscribeMessagesRef.current) {
            unsubscribeMessagesRef.current();
        }

        // Subscribe to new chat's messages
        unsubscribeMessagesRef.current = subscribeToMessages(chat.id, (msgs) => {
            setMessages(msgs);
        });

        // Mark as read
        markAsRead(chat.id, "agent");
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedChat) return;

        try {
            await sendMessage(selectedChat.id, currentUser.uid, "agent", inputText);
            setInputText("");
        } catch (err) {
            console.error("Error sending message:", err);
            alert("Failed to send message. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="agent-chats-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading chats...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="agent-chats-page">
            <div className="chats-layout">
                {/* Chat List Sidebar */}
                <div className="chat-list-sidebar glass-card">
                    <div className="sidebar-header">
                        <h2>My Chats</h2>
                        <span className="chat-count">{chats.length}</span>
                    </div>

                    <div className="chat-list">
                        {chats.length === 0 ? (
                            <div className="empty-list">
                                <div className="empty-icon">💬</div>
                                <p>No chats yet</p>
                                <p style={{ fontSize: '12px', color: '#64748b' }}>
                                    Users you've referred will appear here
                                </p>
                            </div>
                        ) : (
                            chats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                                    onClick={() => handleSelectChat(chat)}
                                >
                                    <div className="chat-item-avatar">
                                        {chat.userName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="chat-item-info">
                                        <div className="chat-item-header">
                                            <span className="chat-item-name">{chat.userName}</span>
                                            {chat.unreadCount?.agent > 0 && (
                                                <span className="unread-badge">{chat.unreadCount.agent}</span>
                                            )}
                                        </div>
                                        <div className="chat-item-preview">
                                            {chat.lastMessage || "No messages yet"}
                                        </div>
                                        <div className="chat-item-time">
                                            {chat.lastMessageTime ?
                                                chat.lastMessageTime.toLocaleDateString() :
                                                ''}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Messages Area */}
                <div className="chat-messages-area glass-card">
                    {selectedChat ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-header-avatar">
                                    {selectedChat.userName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="chat-header-info">
                                    <h3>{selectedChat.userName}</h3>
                                    <span className="chat-header-email">{selectedChat.userEmail}</span>
                                </div>
                            </div>

                            <div className="chat-messages">
                                {messages.length === 0 ? (
                                    <div className="empty-messages">
                                        <div className="empty-icon">💬</div>
                                        <p>No messages yet</p>
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
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <div className="no-chat-icon">💬</div>
                            <h3>Select a chat to start messaging</h3>
                            <p>Choose a conversation from the list on the left</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// src/pages/agent/AgentChats.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToAgentChats, sendMessage, subscribeToMessages, markAsRead, initiateAgentChat } from "../../services/chatService";
import { getReferredUsers } from "../../services/agentService";
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
    const [chatSearch, setChatSearch] = useState(""); // Search for existing chats
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [referredUsers, setReferredUsers] = useState([]);
    const [userSearch, setUserSearch] = useState(""); // Search for new chat modal
    const [loadingUsers, setLoadingUsers] = useState(false);
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
        const handleChatsUpdate = (chatList) => {
            console.log("🟢 Received chat list:", chatList);
            setChats(chatList);
            setLoading(false);
        };

        // Attach error handler to the callback function property (pattern used in service)
        handleChatsUpdate.onError = (error) => {
            console.error("🔴 Error in chat subscription:", error);
            setLoading(false);
            // Optional: Set an error state to display to user
        };

        unsubscribeChatsRef.current = subscribeToAgentChats(currentUser.uid, handleChatsUpdate);

        // Safety timeout in case subscription hangs
        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn("⚠️ Chat loading timed out");
                setLoading(false);
            }
        }, 5000);

        return () => {
            clearTimeout(timeoutId);
            if (unsubscribeChatsRef.current) {
                unsubscribeChatsRef.current();
            }
            if (unsubscribeMessagesRef.current) {
                unsubscribeMessagesRef.current();
            }
        };
    }, [currentUser, loading]);

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

    const handleOpenNewChat = async () => {
        try {
            setLoadingUsers(true);
            setShowNewChatModal(true);
            const users = await getReferredUsers(currentUser.uid);
            setReferredUsers(users);
        } catch (error) {
            console.error("Error loading users:", error);
            alert("Failed to load users");
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleStartChat = async (userId) => {
        try {
            const newChat = await initiateAgentChat(currentUser.uid, userId);
            setSelectedChat(newChat);
            setShowNewChatModal(false);
            setUserSearch("");

            // Subscribe to messages for this new chat
            if (unsubscribeMessagesRef.current) {
                unsubscribeMessagesRef.current();
            }
            unsubscribeMessagesRef.current = subscribeToMessages(newChat.id, (msgs) => {
                setMessages(msgs);
            });
            await markAsRead(newChat.id, "agent");
        } catch (error) {
            console.error("Error starting chat:", error);
            alert("Failed to start chat");
        }
    };

    const filteredUsers = referredUsers.filter(user => {
        const searchTerm = userSearch.toLowerCase();
        const name = (user.name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
    });

    // Filter chats based on search
    const filteredChats = chats.filter(chat => {
        const searchTerm = chatSearch.toLowerCase();
        const name = (chat.userName || "").toLowerCase();
        const email = (chat.userEmail || "").toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
    });

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
                        <div>
                            <h2>My Chats</h2>
                            <span className="chat-count">{chats.length}</span>
                        </div>
                        <button
                            className="new-chat-btn"
                            onClick={handleOpenNewChat}
                            title="Start new chat"
                        >
                            ✉️ New Chat
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="chat-search">
                        <input
                            type="text"
                            placeholder="Search chats by name or email..."
                            value={chatSearch}
                            onChange={(e) => setChatSearch(e.target.value)}
                            className="search-input"
                        />
                        {chatSearch && (
                            <button
                                className="clear-search-btn"
                                onClick={() => setChatSearch("")}
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="chat-list">
                        {filteredChats.length === 0 ? (
                            <div className="empty-list">
                                <div className="empty-icon">💬</div>
                                {chatSearch ? (
                                    <>
                                        <p>No chats match your search</p>
                                        <p style={{ fontSize: '12px', color: '#64748b' }}>
                                            Try a different search term
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p>No chats yet</p>
                                        <p style={{ fontSize: '12px', color: '#64748b' }}>
                                            Users you've referred will appear here
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            filteredChats.map((chat) => (
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

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
                    <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Start New Chat</h2>
                            <button className="close-btn" onClick={() => setShowNewChatModal(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="modal-search">
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="modal-body">
                            {loadingUsers ? (
                                <div className="modal-loading">
                                    <div className="spinner"></div>
                                    <p>Loading your referred users...</p>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="empty-modal">
                                    <div className="empty-icon">👥</div>
                                    <p>
                                        {userSearch ? 'No users match your search' : 'No referred users yet'}
                                    </p>
                                </div>
                            ) : (
                                <div className="user-list">
                                    {filteredUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="user-item"
                                            onClick={() => handleStartChat(user.id)}
                                        >
                                            <div className="user-avatar">
                                                {(user.name || user.email)?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="user-info">
                                                <div className="user-name">{user.name || 'No Name'}</div>
                                                <div className="user-email">{user.email}</div>
                                            </div>
                                            <div className="chat-arrow">→</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

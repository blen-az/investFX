// src/pages/LiveChat.jsx
import React, { useState, useEffect, useRef } from "react";
import "./LiveChat.css";

export default function LiveChat() {
    const [messages, setMessages] = useState([
        { id: 1, text: "Welcome to FortuneTrade Support! How can we help you today?", sender: "agent", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newMessage = {
            id: messages.length + 1,
            text: inputText,
            sender: "user",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText("");

        // Simulate agent response
        setTimeout(() => {
            const responses = [
                "I understand. Let me check that for you.",
                "Could you please provide your transaction ID?",
                "Our team is currently looking into this.",
                "Is there anything else I can help you with?",
                "Please hold on a moment while I retrieve your account details."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            setMessages(prev => [...prev, {
                id: prev.length + 1,
                text: randomResponse,
                sender: "agent",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }, 1500);
    };

    return (
        <div className="live-chat-page">
            <div className="chat-container glass-card">
                <div className="chat-header">
                    <div className="agent-avatar">
                        <div className="avatar-img">👩‍💼</div>
                        <div className="online-status"></div>
                    </div>
                    <div className="header-info">
                        <h2>Live Support</h2>
                        <span className="status-text">Online • Typically replies in 2m</span>
                    </div>
                </div>

                <div className="chat-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender}`}>
                            <div className="message-bubble">
                                {msg.text}
                            </div>
                            <div className="message-time">{msg.time}</div>
                        </div>
                    ))}
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
                    <button type="submit" className="send-btn">
                        ➤
                    </button>
                </form>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import AgentSidebar from './AgentSidebar';
import './AgentLayout.css';

const AgentLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="agent-layout">
            <AgentSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="agent-main-content">
                {/* Mobile Header */}
                <header className="mobile-header">
                    <button
                        className="mobile-toggle-btn"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        ☰
                    </button>
                    <span className="mobile-title">Admin System</span>
                </header>

                <div className="content-scrollable">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AgentLayout;

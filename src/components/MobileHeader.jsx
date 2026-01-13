import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./MobileHeader.css";

export default function MobileHeader() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef(null);
    const userInfoRef = useRef(null);

    const toggleUserDropdown = () => {
        if (!showUserDropdown && userInfoRef.current) {
            const rect = userInfoRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.right + window.scrollX - 180,
            });
        }
        setShowUserDropdown(!showUserDropdown);
    };

    const handleMineClick = () => {
        setShowUserDropdown(false);
        navigate("/wallet");
    };

    const handleLogoutClick = async () => {
        setShowUserDropdown(false);
        await logout();
        navigate("/");
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                userInfoRef.current &&
                !userInfoRef.current.contains(event.target)
            ) {
                setShowUserDropdown(false);
            }
        };

        if (showUserDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showUserDropdown]);

    if (!user) return null;

    return (
        <>
            <header className="mobile-header">
                <div className="mobile-header-container">
                    <Link to="/home" className="mobile-brand">
                        <span className="mobile-brand-icon">⚡</span>
                        <span className="mobile-brand-text">WayMore</span>
                    </Link>

                    <div className="mobile-user-info" ref={userInfoRef} onClick={toggleUserDropdown}>
                        <div className="mobile-user-avatar">
                            {(user.displayName || user.email).charAt(0).toUpperCase()}
                        </div>
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{
                                marginLeft: '4px',
                                transition: 'transform 0.2s',
                                transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                        >
                            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
            </header>

            {showUserDropdown &&
                ReactDOM.createPortal(
                    <div
                        ref={dropdownRef}
                        className="user-dropdown-menu"
                        style={{
                            position: 'fixed',
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`
                        }}
                    >
                        <button onClick={handleMineClick} className="user-dropdown-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M20 12V8C20 6.89543 19.1046 6 18 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H18C19.1046 18 20 17.1046 20 16V14M20 12H14C12.8954 12 12 12.8954 12 14V14C12 15.1046 12.8954 16 14 16H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Mine
                        </button>
                        <button onClick={handleLogoutClick} className="user-dropdown-item logout-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" />
                                <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" />
                                <path d="M21 12H9" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            Logout
                        </button>
                    </div>,
                    document.body
                )}
        </>
    );
}

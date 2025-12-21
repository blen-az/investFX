import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MobileBottomNav.css';

export default function MobileBottomNav() {
    const { user } = useAuth();
    const location = useLocation();

    // Don't show on login/signup pages
    if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/') {
        return null;
    }

    // Different nav items based on user role
    const getNavItems = () => {
        if (!user) {
            return [
                { path: '/market', icon: '📊', label: 'Market' },
                { path: '/login', icon: '🔐', label: 'Login' }
            ];
        }

        if (user.role === 'admin') {
            return [
                { path: '/admin/dashboard', icon: '📈', label: 'Dashboard' },
                { path: '/admin/users', icon: '👥', label: 'Users' },
                { path: '/admin/deposits', icon: '💰', label: 'Deposits' },
                { path: '/admin/trades', icon: '📊', label: 'Trades' },
                { path: '/admin/settings', icon: '⚙️', label: 'Settings' }
            ];
        }

        if (user.role === 'agent') {
            return [
                { path: '/agent/dashboard', icon: '📈', label: 'Dashboard' },
                { path: '/agent/referrals', icon: '👥', label: 'Referrals' },
                { path: '/market', icon: '📊', label: 'Market' },
                { path: '/agent/commissions', icon: '💰', label: 'Commissions' },
                { path: '/agent/settings', icon: '⚙️', label: 'Settings' }
            ];
        }

        return [
            { path: '/home', icon: '🏠', label: 'Home' },
            { path: '/assets', icon: '💼', label: 'Assets' },
            { path: '/trade', icon: '📈', label: 'Trade' },
            { path: '/transactions', icon: '💳', label: 'History' },
            { path: '/wallet', icon: '👤', label: 'Mine' }
        ];
    };

    const navItems = getNavItems();

    return (
        <nav className="mobile-bottom-nav">
            <div className="mobile-nav-container">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `mobile-nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="mobile-nav-icon">{item.icon}</span>
                        <span className="mobile-nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

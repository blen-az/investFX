import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    Users,
    ArrowDownCircle,
    BarChart2,
    Settings,
    Home,
    TrendingUp,
    History,
    User,
    Lock,
    Wallet,
    Coins
} from 'lucide-react';
import './MobileBottomNav.css';

export default function MobileBottomNav() {
    const { user, userRole, isAdmin, isAgent } = useAuth();
    const location = useLocation();

    // Don't show on login/signup pages
    if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/') {
        return null;
    }

    // Different nav items based on user role
    const getNavItems = () => {
        if (!user) {
            return [
                { path: '/market', icon: <BarChart2 size={24} />, label: 'Market' },
                { path: '/login', icon: <Lock size={24} />, label: 'Login' }
            ];
        }

        if (isAdmin()) {
            return [
                { path: '/admin/dashboard', icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
                { path: '/admin/users', icon: <Users size={24} />, label: 'Users' },
                { path: '/admin/deposits', icon: <ArrowDownCircle size={24} />, label: 'Deposits' },
                { path: '/admin/trades', icon: <BarChart2 size={24} />, label: 'Trades' },
                { path: '/admin/settings', icon: <Settings size={24} />, label: 'Settings' }
            ];
        }

        if (isAgent()) {
            return [
                { path: '/agent/dashboard', icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
                { path: '/agent/referrals', icon: <Users size={24} />, label: 'Referrals' },
                { path: '/market', icon: <BarChart2 size={24} />, label: 'Market' },
                { path: '/agent/commissions', icon: <Wallet size={24} />, label: 'Commissions' },
                { path: '/agent/settings', icon: <Settings size={24} />, label: 'Settings' }
            ];
        }

        return [
            { path: '/home', icon: <Home size={24} />, label: 'Home' },
            { path: '/market', icon: <BarChart2 size={24} />, label: 'Market' },
            { path: '/trade', icon: <TrendingUp size={24} />, label: 'Trade' },
            { path: '/assets', icon: <Coins size={24} />, label: 'Assets' },
            { path: '/transactions', icon: <History size={24} />, label: 'History' },
            { path: '/wallet', icon: <User size={24} />, label: 'Mine' }
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

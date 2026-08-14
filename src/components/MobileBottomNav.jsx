import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, BarChart2, TrendingUp, Coins, History,
  LayoutDashboard, Users, ArrowDownCircle,
  Settings, ClipboardList, Wallet
} from 'lucide-react';

export default function MobileBottomNav() {
  const { user, isAdmin, isAgent } = useAuth();
  const location = useLocation();

  // Hide on auth/landing pages
  const hidden = ['/', '/login', '/signup', '/forgot-password'];
  if (hidden.includes(location.pathname)) return null;

  const userItems = [
    { path: '/home',         icon: <Home size={20} />,       label: 'Home' },
    { path: '/market',       icon: <BarChart2 size={20} />,  label: 'Market' },
    { path: '/trade',        icon: <TrendingUp size={20} />, label: 'Trade' },
    { path: '/assets',       icon: <Coins size={20} />,      label: 'Assets' },
    { path: '/transactions', icon: <History size={20} />,    label: 'Activity' },
  ];

  const adminItems = [
    { path: '/admin/dashboard',      icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/users',          icon: <Users size={20} />,           label: 'Users' },
    { path: '/admin/deposits',       icon: <ArrowDownCircle size={20} />, label: 'Deposits' },
    { path: '/admin/balance-history',icon: <ClipboardList size={20} />,   label: 'Bal. Log' },
    { path: '/admin/settings',       icon: <Settings size={20} />,        label: 'Settings' },
  ];

  const agentItems = [
    { path: '/agent/dashboard',   icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/agent/referrals',   icon: <Users size={20} />,           label: 'Referrals' },
    { path: '/market',            icon: <BarChart2 size={20} />,       label: 'Market' },
    { path: '/agent/commissions', icon: <Wallet size={20} />,          label: 'Commission' },
    { path: '/agent/settings',    icon: <Settings size={20} />,        label: 'Settings' },
  ];

  const publicItems = [
    { path: '/market', icon: <BarChart2 size={20} />, label: 'Market' },
    { path: '/login',  icon: <Home size={20} />,      label: 'Login' },
  ];

  let items = publicItems;
  if (user) {
    if (isAdmin()) items = adminItems;
    else if (isAgent()) items = agentItems;
    else items = userItems;
  }

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Main navigation">
      <div className="mobile-nav-container">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";              // Dashboard (protected)
import Market from "./pages/Market";
import CoinDetails from "./pages/CoinDetails";
import Trade from "./pages/Trade";
import News from "./pages/News";
import Profile from "./pages/Profile";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Support from "./pages/Support";
import LiveChat from "./pages/LiveChat";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import AgentCreator from "./pages/admin/AgentCreator";
import Deposits from "./pages/admin/Deposits";
import Withdrawals from "./pages/admin/Withdrawals";
import Trades from "./pages/admin/Trades";
import TradeSettings from "./pages/admin/TradeSettings";

// Agent Pages
import AgentDashboard from "./pages/agent/AgentDashboard";
import Referrals from "./pages/agent/Referrals";

// ⭐ Smart redirect component
import HomeRedirect from "./components/HomeRedirect";
import RoleRedirect from "./components/RoleRedirect";

import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/RequireAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./constants/roles";

import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>

            {/* ROOT PATH - Shows landing page for guests, redirects based on role for logged-in users */}
            <Route path="/" element={<HomeRedirect />} />

            {/* PUBLIC ROUTES */}
            <Route path="/market" element={<Market />} />
            <Route path="/coin/:id" element={<CoinDetails />} />
            <Route path="/news" element={<News />} />

            {/* AUTH ROUTES */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* USER PROTECTED ROUTES */}
            <Route
              path="/home"
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />

            <Route
              path="/trade"
              element={
                <RequireAuth>
                  <Trade />
                </RequireAuth>
              }
            />

            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />

            <Route
              path="/deposit"
              element={
                <RequireAuth>
                  <Deposit />
                </RequireAuth>
              }
            />

            <Route
              path="/withdraw"
              element={
                <RequireAuth>
                  <Withdraw />
                </RequireAuth>
              }
            />

            <Route
              path="/support"
              element={
                <RequireAuth>
                  <Support />
                </RequireAuth>
              }
            />

            <Route
              path="/chat"
              element={
                <RequireAuth>
                  <LiveChat />
                </RequireAuth>
              }
            />

            {/* ADMIN ROUTES */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/create-agent"
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN}>
                  <AgentCreator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deposits"
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN}>
                  <Deposits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/withdrawals"
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN}>
                  <Withdrawals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/trades"
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN}>
                  <Trades />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/trade-settings"
              element={
                <ProtectedRoute requiredRole={ROLES.ADMIN}>
                  <TradeSettings />
                </ProtectedRoute>
              }
            />

            {/* AGENT ROUTES */}
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedRoute requiredRole={ROLES.AGENT}>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/referrals"
              element={
                <ProtectedRoute requiredRole={ROLES.AGENT}>
                  <Referrals />
                </ProtectedRoute>
              }
            />

          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

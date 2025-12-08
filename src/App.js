import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense } from "react";

import Layout from "./components/Layout";
import LoadingPage from "./components/LoadingPage";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";              // Dashboard (protected)
import Market from "./pages/Market";
import CoinDetails from "./pages/CoinDetails";
import Trade from "./pages/Trade";
import News from "./pages/News";
import Profile from "./pages/Profile";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Transactions from "./pages/Transactions";
import Support from "./pages/Support";
import LiveChat from "./pages/LiveChat";
import Verification from "./pages/Verification";
import Settings from "./pages/Settings";

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
import AdminCommissions from "./pages/admin/Commissions";
import Verifications from "./pages/admin/Verifications";

// Agent Pages
import AgentDashboard from "./pages/agent/AgentDashboard";
import Referrals from "./pages/agent/Referrals";
import AgentCommissions from "./pages/agent/Commissions";
import AgentChats from "./pages/agent/AgentChats";
import AgentWithdraw from "./pages/agent/AgentWithdraw";
import AgentSettings from "./pages/agent/AgentSettings";

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
              <Route path="/verification" element={<Verification />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/coin/:id" element={<CoinDetails />} />
              <Route path="/news" element={<News />} />
              <Route path="/market" element={<Market />} />

              {/* AUTH ROUTES */ }
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

  {/* USER PROTECTED ROUTES */ }
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
                path="/transactions"
                element={
                  <RequireAuth>
                    <Transactions />
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

              <Route
                path="/verification"
                element={
                  <RequireAuth>
                    <Verification />
                  </RequireAuth>
                }
              />

  {/* ADMIN ROUTES */ }
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
              <Route
                path="/admin/commissions"
                element={
                  <ProtectedRoute requiredRole={ROLES.ADMIN}>
                    <AdminCommissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/verifications"
                element={
                  <ProtectedRoute requiredRole={ROLES.ADMIN}>
                    <Verifications />
                  </ProtectedRoute>
                }
              />

  {/* AGENT ROUTES */ }
              <Route
                path="/agent/dashboard"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.AGENT]}>
                    <AgentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent/referrals"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.AGENT]}>
                    <Referrals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent/commissions"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.AGENT]}>
                    <AgentCommissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent/chats"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.AGENT]}>
                    <AgentChats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent/withdraw"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.AGENT]}>
                    <AgentWithdraw />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent/settings"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.AGENT]}>
                    <AgentSettings />
                  </ProtectedRoute>
                }
              />

            </Routes >
          </Suspense >
        </Layout >
      </Router >
    </AuthProvider >
  );
}

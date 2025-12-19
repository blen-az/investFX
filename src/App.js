import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

import Layout from "./components/Layout";
import LoadingPage from "./components/LoadingPage";

// ⭐ Smart redirect component
import HomeRedirect from "./components/HomeRedirect";
import RoleRedirect from "./components/RoleRedirect";

import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/RequireAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./constants/roles";
import ErrorBoundary from "./components/ErrorBoundary";

import "./App.css";

// User Pages (Lazy Loaded)
const Home = lazy(() => import("./pages/Home"));
const Market = lazy(() => import("./pages/Market"));
const CoinDetails = lazy(() => import("./pages/CoinDetails"));
const Trade = lazy(() => import("./pages/Trade"));
const News = lazy(() => import("./pages/News"));
const Profile = lazy(() => import("./pages/Profile"));
const Deposit = lazy(() => import("./pages/Deposit"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const Wallet = lazy(() => import("./pages/Wallet"));
const AccountTransfer = lazy(() => import("./pages/AccountTransfer"));
const Exchange = lazy(() => import("./pages/Exchange"));
const Promotion = lazy(() => import("./pages/Promotion"));
const SecurityCenter = lazy(() => import("./pages/SecurityCenter"));
const WithdrawalAddress = lazy(() => import("./pages/WithdrawalAddress"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const DownloadApp = lazy(() => import("./pages/DownloadApp"));
const RegulatoryInfo = lazy(() => import("./pages/RegulatoryInfo"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Support = lazy(() => import("./pages/Support"));
const LiveChat = lazy(() => import("./pages/LiveChat"));
const Verification = lazy(() => import("./pages/Verification"));
const Settings = lazy(() => import("./pages/Settings"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

// Auth Pages (Lazy Loaded)
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Users = lazy(() => import("./pages/admin/Users"));
const AgentCreator = lazy(() => import("./pages/admin/AgentCreator"));
const Deposits = lazy(() => import("./pages/admin/Deposits"));
const Withdrawals = lazy(() => import("./pages/admin/Withdrawals"));
const Trades = lazy(() => import("./pages/admin/Trades"));
const TradeSettings = lazy(() => import("./pages/admin/TradeSettings"));
const AdminCommissions = lazy(() => import("./pages/admin/Commissions"));
const Verifications = lazy(() => import("./pages/admin/Verifications"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

// Agent Pages (Lazy Loaded)
const AgentDashboard = lazy(() => import("./pages/agent/AgentDashboard"));
const Referrals = lazy(() => import("./pages/agent/Referrals"));
const AgentCommissions = lazy(() => import("./pages/agent/Commissions"));
const AgentChats = lazy(() => import("./pages/agent/AgentChats"));
const AgentWithdraw = lazy(() => import("./pages/agent/AgentWithdraw"));
const AgentSettings = lazy(() => import("./pages/agent/AgentSettings"));

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <ErrorBoundary>
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                {/* ... routes ... */}
                {/* ROOT PATH - Shows landing page for guests, redirects based on role for logged-in users */}
                <Route path="/" element={<HomeRedirect />} />

                {/* PUBLIC ROUTES */}
                <Route path="/market" element={<Market />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/settings" element={<Settings />} />
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
                  path="/wallet"
                  element={
                    <RequireAuth>
                      <Wallet />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/account-transfer"
                  element={
                    <RequireAuth>
                      <AccountTransfer />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/exchange"
                  element={
                    <RequireAuth>
                      <Exchange />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/promotion"
                  element={
                    <RequireAuth>
                      <Promotion />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/security"
                  element={
                    <RequireAuth>
                      <SecurityCenter />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/withdrawal-address"
                  element={
                    <RequireAuth>
                      <WithdrawalAddress />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/payment-methods"
                  element={
                    <RequireAuth>
                      <PaymentMethods />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/download-app"
                  element={
                    <RequireAuth>
                      <DownloadApp />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/regulatory-info"
                  element={
                    <RequireAuth>
                      <RegulatoryInfo />
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
                <Route
                  path="/verify-email"
                  element={
                    <RequireAuth>
                      <VerifyEmail />
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
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute requiredRole={ROLES.ADMIN}>
                      <AdminSettings />
                    </ProtectedRoute>
                  }
                />

                {/* AGENT ROUTES */}
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

              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

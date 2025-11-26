import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";              // Dashboard (protected)
import Market from "./pages/Market";
import CoinDetails from "./pages/CoinDetails";
import Trade from "./pages/Trade";
import News from "./pages/News";
import Profile from "./pages/Profile";
import Deposit from "./pages/Deposit";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

// ⭐ Smart redirect component
import HomeRedirect from "./components/HomeRedirect";

import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/RequireAuth";

import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>

            {/* ROOT PATH - Shows landing page for guests, redirects to /home for logged-in users */}
            <Route path="/" element={<HomeRedirect />} />

            {/* PUBLIC ROUTES */}
            <Route path="/market" element={<Market />} />
            <Route path="/coin/:id" element={<CoinDetails />} />
            <Route path="/news" element={<News />} />

            {/* AUTH ROUTES */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* PROTECTED ROUTES (requires login) */}
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
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

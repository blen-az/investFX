// src/components/HomeRedirect.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LandingPage from "../pages/LandingPage";

export default function HomeRedirect() {
    const { user } = useAuth();

    // If user is logged in, redirect to dashboard
    if (user) {
        return <Navigate to="/home" replace />;
    }

    // Otherwise, show landing page
    return <LandingPage />;
}

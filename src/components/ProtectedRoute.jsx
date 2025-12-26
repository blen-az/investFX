// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "../constants/roles";

export default function ProtectedRoute({ children, requiredRole, allowedRoles }) {
    const { user, userRole, emailVerified, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Verifying authentication...</p>
            </div>
        );
    }

    // Not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check email verification (Except for Admins)
    if (!emailVerified && userRole !== ROLES.ADMIN) {
        return <Navigate to="/verify-email" replace />;
    }

    // Check role requirement
    if (requiredRole || (allowedRoles && allowedRoles.length > 0)) {
        const hasAccess =
            (requiredRole && userRole === requiredRole) ||
            (allowedRoles && allowedRoles.includes(userRole)) ||
            userRole === ROLES.ADMIN; // Admin always has access

        if (hasAccess) {
            return children;
        }

        // Unauthorized - redirect based on role
        if (userRole === ROLES.ADMIN) {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (userRole === ROLES.AGENT) {
            return <Navigate to="/agent/dashboard" replace />;
        } else {
            return <Navigate to="/home" replace />;
        }
    }

    // No specific role required, just authentication
    return children;
}

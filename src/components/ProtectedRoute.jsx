// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "../constants/roles";

export default function ProtectedRoute({ children, requiredRole }) {
    const { user, userRole } = useAuth();

    // Not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check role requirement
    if (requiredRole) {
        // Admin can access everything
        if (userRole === ROLES.ADMIN) {
            return children;
        }

        // Agent can access agent routes
        if (requiredRole === ROLES.AGENT && userRole === ROLES.AGENT) {
            return children;
        }

        // User can access user routes
        if (requiredRole === ROLES.USER && userRole === ROLES.USER) {
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

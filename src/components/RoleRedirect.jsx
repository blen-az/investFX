// src/components/RoleRedirect.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "../constants/roles";

/**
 * Component that redirects users to their appropriate dashboard based on role
 * Use this on login success or root path for authenticated users
 */
export default function RoleRedirect() {
    const { userRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (userRole === ROLES.ADMIN) {
            navigate("/admin/dashboard", { replace: true });
        } else if (userRole === ROLES.AGENT) {
            navigate("/agent/dashboard", { replace: true });
        } else {
            navigate("/home", { replace: true });
        }
    }, [userRole, navigate]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                    Redirecting...
                </div>
            </div>
        </div>
    );
}

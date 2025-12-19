import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "../constants/roles";

export default function RequireAuth({ children }) {
  const { user, userRole, emailVerified } = useAuth();
  const location = useLocation();

  // If user is NOT logged in → redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in but NOT verified → redirect to verify-email
  // Exception: Admins are exempt, and don't redirect if already on the verify-email page
  if (!emailVerified && userRole !== ROLES.ADMIN && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  // If user is logged in → allow access
  return children;
}

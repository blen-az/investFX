import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireAuth({ children }) {
  const { user } = useAuth();

  // If user is NOT logged in → redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in → allow access
  return children;
}

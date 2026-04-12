// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import React from "react";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = (localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"));
  const storedUser = (localStorage.getItem("user") || sessionStorage.getItem("user"));
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    (localStorage.removeItem("user"), sessionStorage.removeItem("user"));
  }

  if (!token) return <Navigate to="/login" replace />;

  if (!user) {
    (localStorage.removeItem("accessToken"), sessionStorage.removeItem("accessToken"));
    (localStorage.removeItem("refreshToken"), sessionStorage.removeItem("refreshToken"));
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user, isInitializing } = useAuth();

  // Optional: show loading spinner while auth state initializes
  if (isInitializing) return <p>Loading...</p>;

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
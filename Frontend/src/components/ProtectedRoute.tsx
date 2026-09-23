import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { type JSX } from "react/jsx-runtime";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Prevent flash of login screen while checking authentication status
  if (isLoading) {
    return <div>Loading...</div>; // Replace with a spinner or skeleton UI
  }

  if (!isAuthenticated) {
    // Redirect to login, saving the original location for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
import { Navigate } from "react-router-dom";
import { useAuth } from "../app/auth";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isRestoring } = useAuth();
  if (isRestoring) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

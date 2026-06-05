import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, requireRole }) {
  const { user, role, loading } = useAuth();

  if (loading) return <p style={{ textAlign: "center", padding: 30 }}>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  if (requireRole && role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}


import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DASHBOARD_PATH } from "../constants/roles";

// <ProtectedRoute /> = must be logged in
// <ProtectedRoute roles={["ADMIN"]} /> = must be logged in AND have one of these roles
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8">Loading...</div>;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={DASHBOARD_PATH[user.role]} replace />;
  }

  return <Outlet />;
}

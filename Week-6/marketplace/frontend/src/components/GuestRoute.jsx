import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DASHBOARD_PATH } from "../constants/roles";

export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8">Loading...</div>;
  if (user) return <Navigate to={DASHBOARD_PATH[user.role]} replace />;

  return <Outlet />;
}

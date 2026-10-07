import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DASHBOARD_PATH } from "../constants/roles";

export default function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8">Loading...</div>;
  if (user) {
    const from = location.state?.from?.pathname;
    return (
      <Navigate
        to={from && from !== "/login" ? from : DASHBOARD_PATH[user.role]}
        replace
      />
    );
  }

  return <Outlet />;
}

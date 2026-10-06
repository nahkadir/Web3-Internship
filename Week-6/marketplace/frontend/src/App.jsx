import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import { ROLES, DASHBOARD_PATH } from "./constants/roles";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? DASHBOARD_PATH[user.role] : "/login"} replace />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute roles={[ROLES.CUSTOMER]} />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        </Route>
        <Route element={<ProtectedRoute roles={[ROLES.VENDOR]} />}>
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        </Route>
        <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

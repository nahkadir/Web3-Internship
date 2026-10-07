import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import { ROLES } from "./constants/roles";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import VendorStore from "./pages/VendorStore";
import CustomerDashboard from "./pages/CustomerDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />

        {/* public marketplace */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/vendor/:id" element={<VendorStore />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* /vendor/dashboard is a static path, so it wins over /vendor/:id */}
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

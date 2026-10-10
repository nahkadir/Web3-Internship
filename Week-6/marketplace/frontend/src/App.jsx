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
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import OrderPayment from "./pages/OrderPayment";
import MockCheckout from "./pages/MockCheckout";
import VendorOrders from "./pages/VendorOrders";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />

        {/* public marketplace */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/vendor/:id" element={<VendorStore />} />

        {/* stands in for the payment provider's own hosted page (development only) */}
        <Route path="/pay/mock/:txnId" element={<MockCheckout />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* any logged-in user can shop */}
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/orders/:id/payment" element={<OrderPayment />} />
        </Route>

        <Route element={<ProtectedRoute roles={[ROLES.CUSTOMER]} />}>
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        </Route>
        <Route element={<ProtectedRoute roles={[ROLES.VENDOR]} />}>
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/vendor/orders" element={<VendorOrders />} />
        </Route>
        <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

import { Router } from "express";
import { env } from "../config/env.js";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import vendorRoutes from "./vendor.routes.js";
import adminVendorRoutes from "./adminVendor.routes.js";
import categoryRoutes from "./category.routes.js";
import vendorProductRoutes from "./vendorProduct.routes.js";
import productRoutes from "./product.routes.js";
import cartRoutes from "./cart.routes.js";
import checkoutRoutes from "./checkout.routes.js";
import orderRoutes from "./order.routes.js";
import vendorOrderRoutes from "./vendorOrder.routes.js";
import paymentRoutes from "./payment.routes.js";
import vendorEarningsRoutes from "./vendorEarnings.routes.js";
import adminCommerceRoutes from "./adminCommerce.routes.js";
import mockGatewayRoutes from "../payments/mock/mockGateway.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/vendors", vendorRoutes);
router.use("/admin/vendors", adminVendorRoutes);
router.use("/admin", adminCommerceRoutes);
router.use("/categories", categoryRoutes);
router.use("/vendor/products", vendorProductRoutes);
router.use("/vendor/orders", vendorOrderRoutes);
router.use("/vendor/earnings", vendorEarningsRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);

if (
  env.payment.provider === "mock" &&
  (env.nodeEnv !== "production" || env.payment.allowMock)
) {
  router.use("/mock-gateway", mockGatewayRoutes);
}

router.use("/", dashboardRoutes);

export default router;

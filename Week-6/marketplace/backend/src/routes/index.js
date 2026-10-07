import { Router } from "express";
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

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/vendors", vendorRoutes);
router.use("/admin/vendors", adminVendorRoutes);
router.use("/categories", categoryRoutes);
router.use("/vendor/products", vendorProductRoutes);
router.use("/products", productRoutes);
router.use("/", dashboardRoutes);
router.use("/cart", cartRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", orderRoutes);
router.use("/vendor/orders", vendorOrderRoutes);

export default router;

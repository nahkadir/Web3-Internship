import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import vendorRoutes from "./vendor.routes.js";
import adminVendorRoutes from "./adminVendor.routes.js";
import categoryRoutes from "./category.routes.js";
import vendorProductRoutes from "./vendorProduct.routes.js";
import productRoutes from "./product.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/vendors", vendorRoutes);
router.use("/admin/vendors", adminVendorRoutes);
router.use("/categories", categoryRoutes);
router.use("/vendor/products", vendorProductRoutes);
router.use("/products", productRoutes);
router.use("/", dashboardRoutes);

export default router;

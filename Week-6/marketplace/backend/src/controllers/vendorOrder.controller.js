import { asyncHandler } from "../utils/asyncHandler.js";
import * as vendorOrderService from "../services/vendorOrder.service.js";

export const list = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    ...(await vendorOrderService.listVendorOrders(
      req.vendor,
      req.validated.query,
    )),
  });
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    order: await vendorOrderService.getVendorOrder(req.vendor, req.params.id),
  });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const order = await vendorOrderService.updateSegmentStatus(
    req.vendor,
    req.params.id,
    req.body.status,
  );
  res.json({
    success: true,
    message: `Order marked ${req.body.status.toLowerCase()}`,
    order,
  });
});

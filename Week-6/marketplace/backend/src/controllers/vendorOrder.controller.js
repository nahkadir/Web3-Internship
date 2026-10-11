import { asyncHandler } from "../utils/asyncHandler.js";
import * as vendorOrderService from "../services/vendorOrder.service.js";
import { audit } from "../services/audit.service.js";

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
  await audit({
    actor: req.user,
    action: "order.item_status_changed_by_vendor",
    entityType: "Order",
    entityId: req.params.id,
    meta: { vendorId: String(req.vendor._id), to: req.body.status },
  });
  res.json({
    success: true,
    message: `Order marked ${req.body.status.toLowerCase()}`,
    order,
  });
});

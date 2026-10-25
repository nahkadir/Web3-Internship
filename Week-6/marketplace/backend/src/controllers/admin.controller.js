import { asyncHandler } from "../utils/asyncHandler.js";
import * as adminPayments from "../services/adminPayment.service.js";
import * as adminOrders from "../services/adminOrder.service.js";
import { getAdminStats } from "../services/earnings.service.js";
import { audit, listAuditLogs } from "../services/audit.service.js";

export const listPayments = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    ...(await adminPayments.listAdminPayments(req.validated.query)),
  });
});

export const getPayment = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    payment: await adminPayments.getAdminPayment(req.params.id),
  });
});

export const refund = asyncHandler(async (req, res) => {
  const payment = await adminPayments.refundPayment(
    req.user,
    req.params.id,
    req.body?.reason,
  );
  await audit({
    actor: req.user,
    action: "payment.refunded",
    entityType: "Payment",
    entityId: req.params.id,
    meta: { reason: req.body?.reason },
  });
  res.json({ success: true, message: "Payment refunded", payment });
});

export const listOrders = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    ...(await adminOrders.listAdminOrders(req.validated.query)),
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    order: await adminOrders.getAdminOrder(req.params.id),
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await adminOrders.updateAdminOrderStatus(
    req.params.id,
    req.body.status,
  );
  await audit({
    actor: req.user,
    action: "order.status_changed_by_admin",
    entityType: "Order",
    entityId: req.params.id,
    meta: { to: req.body.status },
  });
  res.json({
    success: true,
    message: `Order marked ${req.body.status.toLowerCase()}`,
    order,
  });
});

export const stats = asyncHandler(async (req, res) => {
  res.json({ success: true, stats: await getAdminStats() });
});

export const auditLogs = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await listAuditLogs(req.validated.query)) });
});

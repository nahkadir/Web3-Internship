import { asyncHandler } from "../utils/asyncHandler.js";
import * as orderService from "../services/order.service.js";
import { audit } from "../services/audit.service.js";

export const place = asyncHandler(async (req, res) => {
  const order = await orderService.placeOrder(req.user);
  await audit({
    actor: req.user,
    action: "order.placed",
    entityType: "Order",
    entityId: order.id,
    meta: { total: order.totalAmount },
  });
  res
    .status(201)
    .json({ success: true, message: "Order placed successfully", order });
});

export const list = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    ...(await orderService.listCustomerOrders(
      req.user._id,
      req.validated.query,
    )),
  });
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    order: await orderService.getCustomerOrder(req.user._id, req.params.id),
  });
});

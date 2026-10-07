import { asyncHandler } from "../utils/asyncHandler.js";
import * as orderService from "../services/order.service.js";

export const place = asyncHandler(async (req, res) => {
  const order = await orderService.placeOrder(req.user);
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

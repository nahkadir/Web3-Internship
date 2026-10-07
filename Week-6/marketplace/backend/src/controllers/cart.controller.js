import { asyncHandler } from "../utils/asyncHandler.js";
import * as cartService from "../services/cart.service.js";

export const view = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    cart: await cartService.getCartView(req.user._id),
  });
});

export const add = asyncHandler(async (req, res) => {
  res
    .status(201)
    .json({
      success: true,
      cart: await cartService.addItem(req.user, req.body),
    });
});

export const update = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItem(
    req.user,
    req.params.id,
    req.body.quantity,
  );
  res.json({ success: true, cart });
});

export const remove = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    cart: await cartService.removeItem(req.user, req.params.id),
  });
});

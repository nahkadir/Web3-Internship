import { asyncHandler } from "../utils/asyncHandler.js";
import * as productService from "../services/product.service.js";

/* vendor */
export const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.vendor, req.body);
  res.status(201).json({ success: true, product });
});

export const listMine = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    ...(await productService.listVendorProducts(
      req.vendor,
      req.validated.query,
    )),
  });
});

export const stats = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    stats: await productService.getVendorStats(req.vendor),
  });
});

export const getMine = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    product: await productService.getVendorProduct(req.vendor, req.params.id),
  });
});

export const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(
    req.vendor,
    req.params.id,
    req.body,
  );
  res.json({ success: true, product });
});

export const archive = asyncHandler(async (req, res) => {
  const product = await productService.archiveProduct(
    req.vendor,
    req.params.id,
  );
  res.json({ success: true, message: "Product archived", product });
});

/* public */
export const listPublic = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    ...(await productService.listPublicProducts(req.validated.query)),
  });
});

export const getPublic = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    product: await productService.getPublicProduct(req.params.id),
  });
});

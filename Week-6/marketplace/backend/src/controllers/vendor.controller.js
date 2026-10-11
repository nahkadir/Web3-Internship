import { asyncHandler } from "../utils/asyncHandler.js";
import * as vendorService from "../services/vendor.service.js";
import { audit } from "../services/audit.service.js";

export const apply = asyncHandler(async (req, res) => {
  const vendor = await vendorService.applyAsVendor(req.user, req.body);
  res.status(201).json({
    success: true,
    message: "Application submitted. An admin will review it shortly.",
    vendor,
  });
});

export const myVendor = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    vendor: await vendorService.getMyVendor(req.user._id),
  });
});

export const publicVendor = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    vendor: await vendorService.getPublicVendor(req.params.id),
  });
});

export const adminList = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    ...(await vendorService.adminListVendors(req.validated.query)),
  });
});

export const adminGet = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    vendor: await vendorService.adminGetVendor(req.params.id),
  });
});

export const adminUpdateStatus = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendorStatus(
    req.params.id,
    req.body.status,
  );
  await audit({
    actor: req.user,
    action: "vendor.status_changed",
    entityType: "Vendor",
    entityId: vendor._id,
    meta: { to: vendor.status },
  });
  res.json({
    success: true,
    message: `Vendor ${vendor.status.toLowerCase()}`,
    vendor,
  });
});

export const publicList = asyncHandler(async (req, res) => {
  res.json({ success: true, vendors: await vendorService.listPublicVendors() });
});

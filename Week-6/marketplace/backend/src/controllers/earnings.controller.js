import { asyncHandler } from "../utils/asyncHandler.js";
import { getVendorEarnings } from "../services/earnings.service.js";

export const vendorEarnings = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    ...(await getVendorEarnings(req.vendor, req.validated.query)),
  });
});

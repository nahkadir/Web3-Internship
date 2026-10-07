import { Vendor } from "../models/Vendor.js";
import { VENDOR_STATUS } from "../constants/statuses.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// loads the logged-in user's vendor profile (any status) into req.vendor
export const attachVendor = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });
  if (!vendor) {
    throw new AppError(
      "Vendor profile required. Submit a vendor application first.",
      403,
    );
  }
  req.vendor = vendor;
  next();
});

// write actions need an approved vendor
export const requireApprovedVendor = (req, res, next) => {
  if (req.vendor.status !== VENDOR_STATUS.APPROVED) {
    return next(
      new AppError(
        `Your vendor account is ${req.vendor.status}. Only approved vendors can manage products.`,
        403,
      ),
    );
  }
  next();
};

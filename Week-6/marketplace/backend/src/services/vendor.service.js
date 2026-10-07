import { Vendor } from "../models/Vendor.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { ROLES } from "../constants/roles.js";
import { VENDOR_STATUS } from "../constants/statuses.js";
import { AppError } from "../utils/AppError.js";
import { buildPagination } from "../utils/pagination.js";

export const applyAsVendor = async (user, data) => {
  if (user.role === ROLES.ADMIN)
    throw new AppError("Admins cannot apply as vendors", 403);

  if (await Vendor.exists({ userId: user._id })) {
    throw new AppError("You have already submitted a vendor application", 409);
  }

  const vendor = await Vendor.create({
    userId: user._id,
    storeName: data.storeName,
    storeDescription: data.storeDescription ?? "",
    logo: data.logo ?? "",
    // status is never taken from the client: schema default is PENDING
  });

  // applicants become VENDOR (limited by status until an admin approves them)
  if (user.role === ROLES.CUSTOMER) {
    await User.findByIdAndUpdate(user._id, { role: ROLES.VENDOR });
  }
  return vendor;
};

export const getMyVendor = async (userId) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new AppError("No vendor profile found", 404);
  return vendor;
};

export const getPublicVendor = async (id) => {
  const vendor = await Vendor.findOne({
    _id: id,
    status: VENDOR_STATUS.APPROVED,
  }).select("storeName storeDescription logo createdAt");
  if (!vendor) throw new AppError("Store not found", 404);
  return vendor;
};

const withUser = (doc) => {
  const { userId, ...rest } = doc.toJSON();
  return { ...rest, user: userId };
};

export const adminListVendors = async ({ status, page, limit }) => {
  const filter = status ? { status } : {};
  const [docs, total] = await Promise.all([
    Vendor.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name email"),
    Vendor.countDocuments(filter),
  ]);
  return {
    vendors: docs.map(withUser),
    pagination: buildPagination(page, limit, total),
  };
};

export const adminGetVendor = async (id) => {
  const vendor = await Vendor.findById(id).populate("userId", "name email");
  if (!vendor) throw new AppError("Vendor not found", 404);
  const productCount = await Product.countDocuments({ vendorId: vendor._id });
  return { ...withUser(vendor), productCount };
};

const TRANSITIONS = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["SUSPENDED"],
  SUSPENDED: ["APPROVED"], // reactivate
  REJECTED: ["APPROVED"], // second chance
};

export const updateVendorStatus = async (id, status) => {
  const vendor = await Vendor.findById(id);
  if (!vendor) throw new AppError("Vendor not found", 404);

  if (!TRANSITIONS[vendor.status].includes(status)) {
    throw new AppError(
      `Cannot change vendor status from ${vendor.status} to ${status}`,
      400,
    );
  }

  vendor.status = status;
  await vendor.save();
  return vendor;
};

export const listPublicVendors = () =>
  Vendor.find({ status: VENDOR_STATUS.APPROVED })
    .select("storeName logo")
    .sort({ storeName: 1 });

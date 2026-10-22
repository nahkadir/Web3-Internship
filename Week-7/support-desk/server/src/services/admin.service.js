import User, { ROLES } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listUsers = async ({ page, limit, role, search }) => {
  page = Math.min(Math.max(parseInt(page) || 1, 1), 10000);
  limit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

  const filter = {};
  if (role && Object.values(ROLES).includes(role)) filter.role = role;
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

export const updateUserRole = async (targetId, role, actingAdminId) => {
  // prevents the last admin from locking everyone out
  if (targetId === actingAdminId.toString()) {
    throw new ApiError(400, "You cannot change your own role");
  }
  const user = await User.findByIdAndUpdate(
    targetId,
    { role },
    { new: true, runValidators: true },
  );
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

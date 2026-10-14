import { asyncHandler } from "../utils/asyncHandler.js";
import * as adminService from "../services/admin.service.js";

export const getUsers = asyncHandler(async (req, res) => {
  const { users, pagination } = await adminService.listUsers(req.query);
  res.json({ success: true, data: { users, pagination } });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserRole(
    req.params.id,
    req.body.role,
    req.user._id,
  );
  res.json({ success: true, data: { user } });
});

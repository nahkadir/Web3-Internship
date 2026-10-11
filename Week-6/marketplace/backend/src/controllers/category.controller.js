import { asyncHandler } from "../utils/asyncHandler.js";
import * as categoryService from "../services/category.service.js";
import { audit } from "../services/audit.service.js";

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  await audit({
    actor: req.user,
    action: "category.created",
    entityType: "Category",
    entityId: category._id,
    meta: { name: category.name },
  });
  res.status(201).json({ success: true, category });
});

export const list = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    categories: await categoryService.listCategories(),
  });
});

export const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(
    req.params.id,
    req.body,
  );
  await audit({
    actor: req.user,
    action: "category.updated",
    entityType: "Category",
    entityId: category._id,
    meta: { name: category.name },
  });
  res.json({ success: true, category });
});

export const remove = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  await audit({
    actor: req.user,
    action: "category.deleted",
    entityType: "Category",
    entityId: req.params.id,
  });
  res.json({ success: true, message: "Category deleted" });
});

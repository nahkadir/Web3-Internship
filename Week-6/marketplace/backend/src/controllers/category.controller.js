import { asyncHandler } from "../utils/asyncHandler.js";
import * as categoryService from "../services/category.service.js";

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
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
  res.json({ success: true, category });
});

export const remove = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.json({ success: true, message: "Category deleted" });
});

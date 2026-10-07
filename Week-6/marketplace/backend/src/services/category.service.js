import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { slugify } from "../utils/slugify.js";

const makeSlug = (name) => {
  const slug = slugify(name);
  if (!slug) throw new AppError("Name must contain letters or numbers", 400);
  return slug;
};

export const createCategory = async ({ name, description }) => {
  const slug = makeSlug(name);
  if (await Category.findOne({ $or: [{ name }, { slug }] })) {
    throw new AppError("Category already exists", 409);
  }
  return Category.create({ name, slug, description: description ?? "" });
};

export const listCategories = () => Category.find().sort({ name: 1 });

export const updateCategory = async (id, data) => {
  const category = await Category.findById(id);
  if (!category) throw new AppError("Category not found", 404);

  if (data.name !== undefined && data.name !== category.name) {
    const slug = makeSlug(data.name);
    const clash = await Category.findOne({
      _id: { $ne: id },
      $or: [{ name: data.name }, { slug }],
    });
    if (clash) throw new AppError("Category already exists", 409);
    category.name = data.name;
    category.slug = slug;
  }
  if (data.description !== undefined) category.description = data.description;

  await category.save();
  return category;
};

// Documented behaviour: a category cannot be deleted while ANY product (even archived) uses it
export const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new AppError("Category not found", 404);

  const inUse = await Product.countDocuments({ categoryId: id });
  if (inUse > 0) {
    throw new AppError(
      `Cannot delete: ${inUse} product(s) still use this category`,
      409,
    );
  }
  await category.deleteOne();
};

import { randomBytes } from "crypto";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Vendor } from "../models/Vendor.js";
import { PRODUCT_STATUS, VENDOR_STATUS } from "../constants/statuses.js";
import { AppError } from "../utils/AppError.js";
import { slugify } from "../utils/slugify.js";
import { buildPagination } from "../utils/pagination.js";

const { DRAFT, ACTIVE, OUT_OF_STOCK, ARCHIVED } = PRODUCT_STATUS;
const PUBLISHED = [ACTIVE, OUT_OF_STOCK];

const makeProductSlug = (name) =>
  `${slugify(name) || "product"}-${randomBytes(3).toString("hex")}`;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---------- serializers ---------- */

const toVendorProduct = (doc) => {
  const json = doc.toJSON();
  const cat = json.categoryId;
  return { ...json, categoryId: cat?.id ?? cat, category: cat };
};

const toPublic = (doc) => {
  const { vendorId, categoryId, ...rest } = doc.toJSON();
  return { ...rest, vendor: vendorId, category: categoryId };
};

/* ---------- publishing rules (Task 8) ---------- */

const assertCategory = async (categoryId) => {
  if (!(await Category.exists({ _id: categoryId }))) {
    throw new AppError("Category does not exist", 400, [
      { field: "categoryId", message: "Category does not exist" },
    ]);
  }
};

const assertPublishable = async (product, vendor) => {
  if (vendor.status !== VENDOR_STATUS.APPROVED) {
    throw new AppError("Only approved vendors can publish products", 403);
  }

  const errors = [];
  if (!product.name || product.name.trim().length < 3)
    errors.push({ field: "name", message: "A valid product name is required" });
  if (!product.description?.trim())
    errors.push({
      field: "description",
      message: "Description is required to publish",
    });
  if (!(product.price > 0))
    errors.push({ field: "price", message: "Price must be greater than zero" });
  if (!Number.isInteger(product.stock) || product.stock < 0)
    errors.push({
      field: "stock",
      message: "Stock must be a non-negative whole number",
    });
  if (!(await Category.exists({ _id: product.categoryId })))
    errors.push({ field: "categoryId", message: "Category does not exist" });

  if (errors.length)
    throw new AppError("Product cannot be published", 400, errors);
};

// published product with 0 stock -> OUT_OF_STOCK, restocked -> ACTIVE
const syncStockStatus = (product) => {
  if (PUBLISHED.includes(product.status)) {
    product.status = product.stock === 0 ? OUT_OF_STOCK : ACTIVE;
  }
};

/* ---------- vendor side (Task 7) ---------- */
/* Every query is scoped by vendorId: a vendor can only ever touch their own products. */

const findOwned = async (vendor, id) => {
  const product = await Product.findOne({ _id: id, vendorId: vendor._id });
  if (!product) throw new AppError("Product not found", 404); // same answer for "not yours"
  return product;
};

export const createProduct = async (vendor, data) => {
  await assertCategory(data.categoryId);

  const product = new Product({
    vendorId: vendor._id, // always the authenticated vendor, never from the request
    categoryId: data.categoryId,
    name: data.name,
    slug: makeProductSlug(data.name),
    description: data.description ?? "",
    price: data.price,
    stock: data.stock ?? 0,
    images: data.images ?? [],
    status: data.status ?? DRAFT,
  });

  if (product.status === ACTIVE) {
    await assertPublishable(product, vendor);
    syncStockStatus(product);
  }

  await product.save();
  await product.populate("categoryId", "name slug");
  return toVendorProduct(product);
};

export const listVendorProducts = async (vendor, { status, page, limit }) => {
  const filter = { vendorId: vendor._id, status: status ?? { $ne: ARCHIVED } };
  const [docs, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name slug"),
    Product.countDocuments(filter),
  ]);
  return {
    products: docs.map(toVendorProduct),
    pagination: buildPagination(page, limit, total),
  };
};

export const getVendorProduct = async (vendor, id) => {
  const product = await findOwned(vendor, id);
  await product.populate("categoryId", "name slug");
  return toVendorProduct(product);
};

export const updateProduct = async (vendor, id, data) => {
  const product = await findOwned(vendor, id);

  if (data.categoryId) await assertCategory(data.categoryId);

  for (const key of [
    "name",
    "description",
    "price",
    "stock",
    "images",
    "categoryId",
  ]) {
    if (data[key] !== undefined) product[key] = data[key];
  }
  if (data.status !== undefined) product.status = data.status;

  if (PUBLISHED.includes(product.status)) {
    await assertPublishable(product, vendor);
    syncStockStatus(product);
  }

  await product.save();
  await product.populate("categoryId", "name slug");
  return toVendorProduct(product);
};

// "delete" = archive (soft delete) so past orders keep their product data
export const archiveProduct = async (vendor, id) => {
  const product = await findOwned(vendor, id);
  product.status = ARCHIVED;
  await product.save();
  await product.populate("categoryId", "name slug");
  return toVendorProduct(product);
};

export const getVendorStats = async (vendor) => {
  const rows = await Product.aggregate([
    { $match: { vendorId: vendor._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const by = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const active = by[ACTIVE] || 0;
  const outOfStock = by[OUT_OF_STOCK] || 0;
  const draft = by[DRAFT] || 0;
  return {
    total: active + outOfStock + draft, // archived products are not counted
    active,
    outOfStock,
    draft,
    archived: by[ARCHIVED] || 0,
  };
};

/* ---------- public marketplace (Tasks 9 & 10) ---------- */

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

export const listPublicProducts = async (q) => {
  const { search, category, vendor, minPrice, maxPrice, sort, page, limit } = q;
  const empty = { products: [], pagination: buildPagination(page, limit, 0) };

  const filter = { status: ACTIVE };

  // products from pending / rejected / suspended vendors never appear
  if (vendor) {
    if (!(await Vendor.exists({ _id: vendor, status: VENDOR_STATUS.APPROVED })))
      return empty;
    filter.vendorId = vendor;
  } else {
    filter.vendorId = {
      $in: await Vendor.distinct("_id", { status: VENDOR_STATUS.APPROVED }),
    };
  }

  if (category) {
    const cat = await Category.findOne({ slug: category }).select("_id");
    if (!cat) return empty;
    filter.categoryId = cat._id;
  }

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: rx }, { description: rx }];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const [docs, total] = await Promise.all([
    Product.find(filter)
      .sort({ ...SORTS[sort], _id: -1 }) // _id keeps pagination stable
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("vendorId", "storeName logo")
      .populate("categoryId", "name slug"),
    Product.countDocuments(filter),
  ]);

  return {
    products: docs.map(toPublic),
    pagination: buildPagination(page, limit, total),
  };
};

export const getPublicProduct = async (id) => {
  const product = await Product.findOne({ _id: id, status: ACTIVE })
    .populate("vendorId", "storeName storeDescription logo status")
    .populate("categoryId", "name slug");

  if (!product || product.vendorId?.status !== VENDOR_STATUS.APPROVED) {
    throw new AppError("Product not found", 404);
  }

  const out = toPublic(product);
  delete out.vendor.status;
  return out;
};

import { z } from "zod";
import { objectId } from "./common.js";
import { PRODUCT_STATUS } from "../constants/statuses.js";

const fields = {
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(120),
  description: z.string().trim().max(5000),
  price: z.coerce
    .number({ message: "Price must be a number" })
    .positive("Price must be greater than zero"),
  stock: z.coerce
    .number({ message: "Stock must be a number" })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  categoryId: objectId,
  images: z
    .array(z.string().trim().url("Each image must be a valid URL"))
    .max(6, "Maximum 6 images"),
};

export const createProductSchema = z.object({
  body: z.object({
    name: fields.name,
    description: fields.description.optional(),
    price: fields.price,
    stock: fields.stock.optional(),
    categoryId: fields.categoryId,
    images: fields.images.optional(),
    status: z.enum(["DRAFT", "ACTIVE"]).optional(),
  }),
});

// vendorId / slug are not listed, so zod strips them: ownership can never be changed
export const updateProductSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: fields.name.optional(),
      description: fields.description.optional(),
      price: fields.price.optional(),
      stock: fields.stock.optional(),
      categoryId: fields.categoryId.optional(),
      images: fields.images.optional(),
      status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
    })
    .refine(
      (b) => Object.keys(b).length > 0,
      "Provide at least one field to update",
    ),
});

export const vendorListProductsSchema = z.object({
  query: z.object({
    status: z.enum(Object.values(PRODUCT_STATUS)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const listProductsSchema = z.object({
  query: z
    .object({
      search: z.string().trim().max(100).optional(),
      category: z.string().trim().toLowerCase().max(80).optional(),
      vendor: objectId.optional(),
      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional(),
      sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    })
    .refine(
      (q) =>
        q.minPrice === undefined ||
        q.maxPrice === undefined ||
        q.minPrice <= q.maxPrice,
      { message: "minPrice cannot exceed maxPrice", path: ["maxPrice"] },
    ),
});

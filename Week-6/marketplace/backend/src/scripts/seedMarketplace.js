import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Category } from "../models/Category.js";
import { Vendor } from "../models/Vendor.js";
import { User } from "../models/User.js";
import { VENDOR_STATUS } from "../constants/statuses.js";
import { slugify } from "../utils/slugify.js";

const categories = [
  ["Electronics", "Phones, laptops and gadgets"],
  ["Fashion", "Clothing, jackets and accessories"],
  ["Home & Living", "Furniture, decor and kitchen"],
  ["Beauty", "Skincare and personal care"],
  ["Books & Stationery", "Books, notebooks and office supplies"],
  ["Sports & Outdoors", "Fitness and outdoor gear"],
];

await connectDB();

for (const [name, description] of categories) {
  const slug = slugify(name);
  if (await Category.findOne({ slug })) {
    console.log(`Skipped category: ${name}`);
    continue;
  }
  await Category.create({ name, slug, description });
  console.log(`Created category: ${name}`);
}

const vendorUser = await User.findOne({ email: "vendor@marketplace.com" });
if (vendorUser && !(await Vendor.findOne({ userId: vendorUser._id }))) {
  await Vendor.create({
    userId: vendorUser._id,
    storeName: "Demo Vendor Store",
    storeDescription: "A demo store used for testing the marketplace.",
    status: VENDOR_STATUS.APPROVED,
  });
  console.log("Created approved vendor profile for vendor@marketplace.com");
}

await mongoose.connection.close();

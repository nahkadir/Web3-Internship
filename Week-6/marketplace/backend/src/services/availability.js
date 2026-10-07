import { PRODUCT_STATUS, VENDOR_STATUS } from "../constants/statuses.js";

// product must be loaded with vendorId populated ("storeName status userId")
export const itemIssue = (product, quantity) => {
  if (!product) return "This product no longer exists";

  const vendorOk = product.vendorId?.status === VENDOR_STATUS.APPROVED;
  const hidden = [PRODUCT_STATUS.DRAFT, PRODUCT_STATUS.ARCHIVED].includes(
    product.status,
  );
  if (!vendorOk || hidden) return "This product is no longer available";

  if (product.stock < quantity) {
    return product.stock === 0
      ? "Out of stock"
      : `Only ${product.stock} left in stock`;
  }
  return null;
};

export const isOwnProduct = (product, user) =>
  !!product?.vendorId?.userId && product.vendorId.userId.equals(user._id);

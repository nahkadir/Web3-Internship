import { Commission } from "../models/Commission.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import {
  COMMISSION_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
} from "../constants/statuses.js";
import { buildPagination } from "../utils/pagination.js";
import { round2 } from "./pricing.service.js";

const LIVE = [COMMISSION_STATUS.PENDING, COMMISSION_STATUS.PAID];

const dateFilter = ({ from, to }) => {
  if (!from && !to) return {};
  const range = {};
  if (from) range.$gte = from;
  if (to) {
    const end = new Date(to);
    end.setUTCHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return { createdAt: range };
};

export const getVendorEarnings = async (vendor, { page, limit, from, to }) => {
  const match = { vendorId: vendor._id, ...dateFilter({ from, to }) }; // a vendor only ever sees their own rows

  const [groups, docs, total] = await Promise.all([
    Commission.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          gross: { $sum: "$grossAmount" },
          commission: { $sum: "$commissionAmount" },
          net: { $sum: "$vendorAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Commission.find(match)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("orderId", "orderNumber")
      .populate("orderItemId", "productName quantity"),
    Commission.countDocuments(match),
  ]);

  const by = Object.fromEntries(groups.map((g) => [g._id, g]));
  const sum = (key, statuses) =>
    round2(statuses.reduce((s, st) => s + (by[st]?.[key] ?? 0), 0));

  return {
    summary: {
      totalSales: sum("gross", LIVE),
      totalCommission: sum("commission", LIVE),
      netEarnings: sum("net", LIVE),
      paidEarnings: sum("net", [COMMISSION_STATUS.PAID]),
      pendingEarnings: sum("net", [COMMISSION_STATUS.PENDING]),
      salesCount: sum("count", LIVE),
    },
    transactions: docs.map((c) => ({
      id: c.id,
      orderId: c.orderId?.id,
      orderNumber: c.orderId?.orderNumber,
      productName: c.orderItemId?.productName,
      quantity: c.orderItemId?.quantity,
      grossAmount: c.grossAmount,
      commissionRate: c.commissionRate,
      commissionAmount: c.commissionAmount,
      vendorAmount: c.vendorAmount,
      status: c.status,
      createdAt: c.createdAt,
    })),
    pagination: buildPagination(page, limit, total),
  };
};

export const getAdminStats = async () => {
  const [
    totalOrders,
    paidOrders,
    pendingPayments,
    failedPayments,
    sales,
    commissions,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ paymentStatus: PAYMENT_STATUS.PAID }),
    Order.countDocuments({
      status: ORDER_STATUS.PENDING,
      paymentStatus: {
        $in: ["UNPAID", PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING],
      },
    }),
    Payment.countDocuments({ status: PAYMENT_STATUS.FAILED }),
    Order.aggregate([
      { $match: { paymentStatus: PAYMENT_STATUS.PAID } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Commission.aggregate([
      { $match: { status: { $in: LIVE } } },
      {
        $group: {
          _id: null,
          commission: { $sum: "$commissionAmount" },
          vendor: { $sum: "$vendorAmount" },
        },
      },
    ]),
  ]);

  return {
    totalOrders,
    paidOrders,
    pendingPayments,
    failedPayments,
    totalSales: round2(sales[0]?.total ?? 0),
    totalCommission: round2(commissions[0]?.commission ?? 0),
    vendorEarnings: round2(commissions[0]?.vendor ?? 0),
  };
};

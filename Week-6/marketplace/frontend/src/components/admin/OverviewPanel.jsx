import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { formatPrice } from "../../lib/utils";
import ErrorBanner from "../ErrorBanner";

const QUICK = [
  ["orders", "Orders", "Search, fulfil and cancel orders"],
  ["payments", "Payments", "Monitor transactions and refunds"],
  ["vendors", "Vendors", "Approve, reject or suspend stores"],
  ["categories", "Categories", "Manage the product categories"],
];

export default function OverviewPanel({ onNavigate }) {
  const { data, error } = useApi("/admin/stats");
  const s = data?.stats;
  const num = (v) => (s ? v : "–");
  const money = (v) => (s ? formatPrice(v) : "–");

  const cards = [
    ["Total orders", num(s?.totalOrders)],
    ["Paid orders", num(s?.paidOrders)],
    ["Pending payments", num(s?.pendingPayments)],
    ["Failed payments", num(s?.failedPayments)],
    ["Marketplace sales", money(s?.totalSales)],
    ["Platform commission", money(s?.totalCommission)],
    ["Vendor earnings", money(s?.vendorEarnings)],
  ];

  return (
    <section>
      <ErrorBanner message={error?.message} />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="min-w-0 bg-paper-white p-4">
            <p className="text-[12px] text-slate-gray">{label}</p>
            <p className="mt-2 truncate text-[26px] font-bold leading-[1.2]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-[20px] font-bold leading-[1.2]">
        Quick access
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {QUICK.map(([key, label, text]) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            className="cursor-pointer bg-paper-white p-4 text-left hover:bg-white/60"
          >
            <p className="text-[16px] font-bold">{label}</p>
            <p className="mt-1 text-[13px] text-slate-gray">{text}</p>
          </button>
        ))}
        <Link to="/products" className="bg-paper-white p-4 hover:bg-white/60">
          <p className="text-[16px] font-bold">Products</p>
          <p className="mt-1 text-[13px] text-slate-gray">
            Browse the live marketplace catalog
          </p>
        </Link>
      </div>
    </section>
  );
}

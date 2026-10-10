import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { buildQuery, formatDate, formatPrice } from "../lib/utils";
import FormField from "./FormField";
import StatusBadge from "./StatusBadge";
import Pagination from "./Pagination";
import ErrorBanner from "./ErrorBanner";

export default function VendorEarnings() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const badRange = !!from && !!to && from > to;

  const { data, loading, error } = useApi(
    `/vendor/earnings${buildQuery({ page, limit: 10, from, to })}`,
    {
      enabled: !badRange,
    },
  );

  const s = data?.summary;
  const money = (v) => (s ? formatPrice(v) : "–");
  const cards = [
    ["Total sales", s ? s.salesCount : "–"],
    ["Gross revenue", money(s?.totalSales)],
    ["Platform commission", money(s?.totalCommission)],
    ["Net earnings", money(s?.netEarnings)],
    ["Pending earnings", money(s?.pendingEarnings)],
    ["Paid earnings", money(s?.paidEarnings)],
  ];

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-[26px] font-bold leading-[1.2]">Earnings</h2>
        <div className="flex flex-wrap gap-3">
          <FormField
            id="from"
            label="From"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <FormField
            id="to"
            label="To"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            error={badRange ? "Start date is after end date" : undefined}
          />
        </div>
      </div>

      <ErrorBanner message={error?.message} />

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <div key={label} className="min-w-0 bg-paper-white p-4">
            <p className="text-[12px] text-slate-gray">{label}</p>
            <p className="mt-2 truncate text-[20px] font-bold leading-[1.2]">
              {value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-slate-gray">
        Pending earnings are from paid orders still being fulfilled. They move
        to Paid once the order item is delivered. Cancelled and refunded sales
        are not counted.
      </p>

      <div
        className={`mt-4 overflow-x-auto bg-paper-white ${loading ? "opacity-60" : ""}`}
      >
        {data?.transactions.length === 0 ? (
          <p className="px-4 py-12 text-center text-[15px] text-slate-gray">
            No earnings in this period yet.
          </p>
        ) : (
          <table className="w-full min-w-[820px] text-left text-[14px]">
            <thead className="border-b border-cloud-veil text-[12px] text-slate-gray">
              <tr>
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Sale amount</th>
                <th className="p-4 font-medium">Commission</th>
                <th className="p-4 font-medium">Vendor amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud-veil">
              {(data?.transactions ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="p-4 font-medium">{t.orderNumber}</td>
                  <td className="p-4">
                    <span className="line-clamp-2 max-w-[220px]">
                      {t.productName}
                    </span>
                    <span className="text-[12px] text-slate-gray">
                      Qty {t.quantity}
                    </span>
                  </td>
                  <td className="p-4">{formatPrice(t.grossAmount)}</td>
                  <td className="p-4 text-slate-gray">
                    {formatPrice(t.commissionAmount)} (
                    {Math.round(t.commissionRate * 100)}%)
                  </td>
                  <td className="p-4 font-bold">
                    {formatPrice(t.vendorAmount)}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="p-4 text-slate-gray">
                    {formatDate(t.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </section>
  );
}

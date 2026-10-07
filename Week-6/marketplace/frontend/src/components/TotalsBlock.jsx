import { formatPrice } from "../lib/utils";

export default function TotalsBlock({ totals, compact = false }) {
  const rows = [["Subtotal", totals.subtotal]];
  if (!compact) {
    rows.push(
      ["Shipping", totals.shippingAmount],
      ["Discount", 0 - totals.discountAmount],
      ["Tax", totals.taxAmount],
    );
  }

  return (
    <dl className="text-[14px]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between py-1.5">
          <dt className="text-slate-gray">{label}</dt>
          <dd>{value < 0 ? `−${formatPrice(-value)}` : formatPrice(value)}</dd>
        </div>
      ))}
      {!compact && (
        <div className="mt-2 flex justify-between border-t border-cloud-veil pt-3 text-[18px] font-bold">
          <dt>Total</dt>
          <dd>{formatPrice(totals.totalAmount)}</dd>
        </div>
      )}
    </dl>
  );
}

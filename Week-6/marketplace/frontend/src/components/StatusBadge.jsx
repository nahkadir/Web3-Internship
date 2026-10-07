const STYLES = {
  APPROVED: "border-midcurrent-navy bg-midcurrent-navy text-paper-white",
  ACTIVE: "border-midcurrent-navy bg-midcurrent-navy text-paper-white",
  PENDING: "border-soft-stone text-midcurrent-navy",
  DRAFT: "border-soft-stone text-midcurrent-navy",
  SUSPENDED: "border-red-700 text-red-700",
  REJECTED: "border-red-700 text-red-700",
  OUT_OF_STOCK: "border-soft-stone bg-morning-mist text-slate-gray",
  ARCHIVED: "border-soft-stone bg-morning-mist text-slate-gray",
};

export default function StatusBadge({ status }) {
  const label =
    status === "OUT_OF_STOCK"
      ? "Out of stock"
      : status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-[30px] border px-3 py-0.5 text-[12px] font-medium ${STYLES[status]}`}
    >
      {label}
    </span>
  );
}

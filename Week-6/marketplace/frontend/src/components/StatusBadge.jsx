const FILLED = "border-midcurrent-navy bg-midcurrent-navy text-paper-white";
const OUTLINE = "border-soft-stone text-midcurrent-navy";
const DANGER = "border-red-700 text-red-700";
const MUTED = "border-soft-stone bg-morning-mist text-slate-gray";

const STYLES = {
  APPROVED: FILLED,
  ACTIVE: FILLED,
  DELIVERED: FILLED,
  PENDING: OUTLINE,
  DRAFT: OUTLINE,
  CONFIRMED: OUTLINE,
  PROCESSING: OUTLINE,
  SHIPPED: "border-midcurrent-navy text-midcurrent-navy",
  SUSPENDED: DANGER,
  REJECTED: DANGER,
  CANCELLED: DANGER,
  OUT_OF_STOCK: MUTED,
  ARCHIVED: MUTED,
};

export default function StatusBadge({ status }) {
  const label =
    status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " ");
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-[30px] border px-3 py-0.5 text-[12px] font-medium ${STYLES[status]}`}
    >
      {label}
    </span>
  );
}

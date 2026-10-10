const CURRENCY = "PKR";

const money = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatPrice = (n) => money.format(n);

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const stockLabel = (stock) =>
  stock > 10 ? "In stock" : stock > 0 ? `Only ${stock} left` : "Out of stock";

export const isHttpUrl = (value) => {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
};

export const buildQuery = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

// ApiError -> readable text (joins field errors if the backend sent any)
export const describeError = (err) =>
  err?.errors?.length
    ? err.errors.map((e) => e.message).join(" · ")
    : err?.message || "Something went wrong";

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const pillClass = (active) =>
  `cursor-pointer rounded-[30px] border px-4 py-2 text-[13px] font-medium ${
    active
      ? "border-midcurrent-navy bg-midcurrent-navy text-paper-white"
      : "border-cloud-veil bg-paper-white text-midcurrent-navy hover:border-soft-stone"
  }`;

const SIZES = {
  md: "px-6 py-3 text-[15px]",
  sm: "px-4 py-2 text-[14px]",
};

const VARIANTS = {
  primary: "bg-midcurrent-navy text-paper-white hover:opacity-90",
  ghost:
    "border border-cloud-veil text-midcurrent-navy hover:border-soft-stone",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center rounded-[30px] font-medium leading-[1.2] transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
      disabled={loading || props.disabled}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 100,
  disabled = false,
}) {
  const btn =
    "flex h-9 w-9 cursor-pointer items-center justify-center text-[16px] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="inline-flex items-center rounded-[30px] border border-cloud-veil bg-paper-white">
      <button
        type="button"
        className={btn}
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span
        className="min-w-8 text-center text-[14px] font-medium"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={btn}
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

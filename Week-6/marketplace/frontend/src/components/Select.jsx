export default function Select({ label, id, error, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium">
          {label}
        </label>
      )}
      <select
        id={id}
        name={id}
        className={`h-11 cursor-pointer rounded-[30px] border bg-paper-white px-4 text-[14px] outline-none ${
          error ? "border-red-700" : "border-cloud-veil focus:border-soft-stone"
        }`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="px-2 text-[12px] text-red-700">{error}</p>}
    </div>
  );
}

export default function FormField({
  label,
  id,
  error,
  hint,
  as = "input",
  ...inputProps
}) {
  const Tag = as;
  const shape =
    as === "textarea" ? "min-h-28 rounded-[20px] py-3" : "h-11 rounded-[30px]";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      <Tag
        id={id}
        name={id}
        aria-invalid={!!error}
        className={`border bg-paper-white px-5 text-[15px] outline-none placeholder:text-slate-gray ${shape} ${
          error ? "border-red-700" : "border-cloud-veil focus:border-soft-stone"
        }`}
        {...inputProps}
      />
      {error ? (
        <p className="px-2 text-[12px] text-red-700">{error}</p>
      ) : (
        hint && <p className="px-2 text-[12px] text-slate-gray">{hint}</p>
      )}
    </div>
  );
}

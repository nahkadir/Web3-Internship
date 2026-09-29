export default function FormField({ label, id, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        name={id}
        {...props}
        className={`w-full rounded-lg border bg-bg px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-x-blue ${
          error ? "border-red-500" : "border-hairline"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

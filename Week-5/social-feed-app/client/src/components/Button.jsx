export default function Button({
  variant = "filled",
  className = "",
  ...props
}) {
  const base =
    "rounded-full font-bold text-[15px] px-4 h-9 transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    filled: "bg-x-blue text-white hover:bg-x-blue-hover",
    outline: "bg-transparent text-text border border-hairline hover:bg-hover",
    ghost: "bg-transparent text-secondary hover:bg-hover",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

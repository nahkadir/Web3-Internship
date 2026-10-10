export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mt-4 rounded-[30px] border border-red-700 px-5 py-2 text-[13px] text-red-700"
    >
      {message}
    </p>
  );
}

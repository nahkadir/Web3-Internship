import { useState } from "react";

export default function Avatar({
  src,
  name,
  size = "h-24 w-24",
  textSize = "text-3xl",
}) {
  const [failed, setFailed] = useState(false);
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={`${size} rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <div
      className={`${size} ${textSize} flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-600`}
    >
      {initial}
    </div>
  );
}

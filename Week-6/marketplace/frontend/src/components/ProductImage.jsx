import { useEffect, useState } from "react";

export default function ProductImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-morning-mist text-[12px] text-slate-gray ${className}`}
      >
        No image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

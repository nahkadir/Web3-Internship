import { useState } from "react";

const MESSAGES = [
  "Welcome to the marketplace: shop from independent vendors",
  "Secure checkout on every order",
];

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const step = (dir) =>
    setIndex((index + dir + MESSAGES.length) % MESSAGES.length);

  return (
    <div className="flex h-9 items-center justify-between bg-deep-cobalt px-4 text-[12px] text-paper-white">
      <button
        onClick={() => step(-1)}
        aria-label="Previous message"
        className="cursor-pointer px-2 text-[16px]"
      >
        ‹
      </button>
      <p className="text-center">{MESSAGES[index]}</p>
      <button
        onClick={() => step(1)}
        aria-label="Next message"
        className="cursor-pointer px-2 text-[16px]"
      >
        ›
      </button>
    </div>
  );
}

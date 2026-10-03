import { useState } from "react";
import { followUser, unfollowUser } from "../api/users";

export default function FollowButton({
  userId,
  isFollowing,
  onChange,
  size = "default",
}) {
  const [following, setFollowing] = useState(isFollowing);
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    const prev = following;
    setFollowing(!prev); // optimistic

    try {
      const result = prev
        ? await unfollowUser(userId)
        : await followUser(userId);
      setFollowing(result.isFollowing);
      onChange?.(result);
    } catch (err) {
      setFollowing(prev); // revert
    } finally {
      setBusy(false);
    }
  };

  const base = size === "small" ? "px-3 py-1 text-sm" : "px-4 py-1.5 text-sm";

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`${base} rounded-full font-bold transition disabled:opacity-50 ${
        following
          ? "border border-hairline text-text hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
          : "bg-text text-bg hover:opacity-90"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}

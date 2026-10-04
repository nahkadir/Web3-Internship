import { Link } from "react-router-dom";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import Avatar from "./Avatar";

const TYPE_CONFIG = {
  LIKE: { Icon: Heart, color: "text-pink-500", message: "liked your post" },
  COMMENT: {
    Icon: MessageCircle,
    color: "text-x-blue",
    message: "commented on your post",
  },
  FOLLOW: { Icon: UserPlus, color: "text-x-blue", message: "followed you" },
};

const formatTime = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

export default function NotificationItem({ notification, onRead }) {
  const { Icon, color, message } = TYPE_CONFIG[notification.type];

  const linkTo =
    notification.type === "FOLLOW"
      ? `/users/${notification.actor.id}`
      : notification.post
        ? `/dashboard` // no single-post page yet — feed is the safe fallback
        : "/dashboard";

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id);
  };

  return (
    <Link
      to={linkTo}
      onClick={handleClick}
      className={`flex gap-3 border-b border-hairline px-4 py-3 transition hover:bg-hover ${
        !notification.isRead ? "bg-x-blue/5" : ""
      }`}
    >
      <Icon
        size={20}
        className={`mt-1 shrink-0 ${color}`}
        fill={notification.type !== "COMMENT" ? "currentColor" : "none"}
      />

      <Avatar
        src={notification.actor.avatar}
        name={notification.actor.name}
        size="h-9 w-9"
        textSize="text-sm"
      />

      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-text">
          <span className="font-bold">{notification.actor.name}</span> {message}
        </p>
        {notification.post?.content && (
          <p className="mt-0.5 truncate text-sm text-secondary">
            {notification.post.content}
          </p>
        )}
        <p className="mt-0.5 text-xs text-secondary">
          {formatTime(notification.createdAt)}
        </p>
      </div>

      {!notification.isRead && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-x-blue" />
      )}
    </Link>
  );
}

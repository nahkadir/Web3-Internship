import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";
import { useAuth } from "../context/AuthContext";

export default function UserRow({ user }) {
  const { user: me } = useAuth();
  const isMe = me?.id === user.id;

  return (
    <div className="flex items-center gap-3 border-b border-hairline px-4 py-3 hover:bg-hover">
      <Link to={`/users/${user.id}`}>
        <Avatar
          src={user.avatar}
          name={user.name}
          size="h-11 w-11"
          textSize="text-base"
        />
      </Link>
      <Link to={`/users/${user.id}`} className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-text">{user.name}</p>
        {user.bio && (
          <p className="truncate text-sm text-secondary">{user.bio}</p>
        )}
      </Link>
      {!isMe && (
        <FollowButton userId={user.id} isFollowing={user.isFollowing} />
      )}
    </div>
  );
}

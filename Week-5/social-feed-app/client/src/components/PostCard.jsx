import { useState } from "react";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

const formatTime = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default function PostCard({ post, onEdit, onDelete }) {
  const { user } = useAuth();
  const isOwner = user?.id === post.author.id;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className="border-b border-hairline px-4 py-3 hover:bg-hover">
      <div className="flex gap-3">
        <Avatar
          src={post.author.avatar}
          name={post.author.name}
          size="h-10 w-10"
          textSize="text-base"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap items-baseline gap-1 text-[15px]">
              <span className="font-bold text-text">{post.author.name}</span>
              <span className="text-secondary">
                · {formatTime(post.createdAt)}
              </span>
            </div>

            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="grid h-8 w-8 place-items-center rounded-full text-secondary hover:bg-x-blue/10 hover:text-x-blue"
                  aria-label="Post options"
                >
                  ⋯
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-2xl border border-hairline bg-bg py-1 shadow-lg">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit(post);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-text hover:bg-hover"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete(post);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-hover"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="mt-0.5 whitespace-pre-wrap text-[15px] text-text">
            {post.content}
          </p>

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt=""
              className="mt-3 max-h-96 w-full rounded-2xl border border-hairline object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </div>
      </div>
    </article>
  );
}

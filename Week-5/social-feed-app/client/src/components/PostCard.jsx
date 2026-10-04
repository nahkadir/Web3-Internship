import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import Avatar from "./Avatar";
import CommentSection from "./CommentSection";
import { useAuth } from "../context/AuthContext";
import { likePost, unlikePost } from "../api/posts";
import { Link } from "react-router-dom";

const formatTime = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
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
  const [showComments, setShowComments] = useState(false);

  const [likedByMe, setLikedByMe] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likeBusy, setLikeBusy] = useState(false);

  const [commentCount, setCommentCount] = useState(post.commentCount);

  const handleToggleLike = async () => {
    if (likeBusy) return; // guards against rapid double-clicks creating races
    setLikeBusy(true);

    // optimistic update
    const prevLiked = likedByMe;
    const prevCount = likeCount;
    setLikedByMe(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const stats = prevLiked
        ? await unlikePost(post.id)
        : await likePost(post.id);
      setLikedByMe(stats.likedByMe);
      setLikeCount(stats.likeCount);
    } catch (err) {
      // revert on failure
      setLikedByMe(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLikeBusy(false);
    }
  };

  return (
    <article className="border-b border-hairline px-4 py-3 hover:bg-hover">
      <div className="flex gap-3">
        <Link to={`/users/${post.author.id}`}>
          <Avatar
            src={post.author.avatar}
            name={post.author.name}
            size="h-10 w-10"
            textSize="text-base"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="relative">
            <div className="flex flex-wrap items-baseline gap-1 pr-8 text-[15px] leading-tight">
              <Link
                to={`/users/${post.author.id}`}
                className="font-bold text-text hover:underline"
              >
                {post.author.name}
              </Link>
              <span className="text-secondary">
                · {formatTime(post.createdAt)}
              </span>
            </div>

            {isOwner && (
              <div className="absolute right-0 top-0">
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

          <p className="whitespace-pre-wrap mt-1 text-[15px] text-text leading-snug">
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

          <div className="mt-1 flex max-w-xs items-center gap-8">
            <button
              onClick={() => setShowComments((v) => !v)}
              className="group flex items-center gap-1"
              aria-label="Toggle comments"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full text-secondary transition group-hover:bg-x-blue/10 group-hover:text-x-blue">
                <MessageCircle size={18} strokeWidth={2} />
              </span>
              <span className="text-xs text-secondary transition group-hover:text-x-blue">
                {commentCount || ""}
              </span>
            </button>

            <button
              onClick={handleToggleLike}
              disabled={likeBusy}
              className="group flex items-center gap-1"
              aria-label={likedByMe ? "Unlike" : "Like"}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-full transition group-hover:bg-pink-500/10 ${
                  likedByMe
                    ? "text-pink-500"
                    : "text-secondary group-hover:text-pink-500"
                }`}
              >
                <Heart
                  size={18}
                  strokeWidth={2}
                  fill={likedByMe ? "currentColor" : "none"}
                />
              </span>
              <span
                className={`text-xs transition group-hover:text-pink-500 ${
                  likedByMe ? "text-pink-500" : "text-secondary"
                }`}
              >
                {likeCount || ""}
              </span>
            </button>
          </div>
        </div>
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          onCountChange={(delta) => setCommentCount((c) => c + delta)}
        />
      )}
    </article>
  );
}

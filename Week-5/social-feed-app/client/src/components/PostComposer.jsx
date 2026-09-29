import { useState } from "react";
import Avatar from "./Avatar";
import Button from "./Button";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../api/posts";
import {
  Search,
  Bell,
  Mail,
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  Bookmark,
  Ellipsis,
  Image,
} from "lucide-react";

const MAX_LEN = 500;

export default function PostComposer({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageField, setShowImageField] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const remaining = MAX_LEN - content.length;
  const isOverLimit = remaining < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Content cannot be empty");
      return;
    }
    if (isOverLimit) {
      setError("Content must be at most 500 characters");
      return;
    }

    setLoading(true);
    try {
      const { post } = await createPost({
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });
      onPostCreated(post);
      setContent("");
      setImageUrl("");
      setShowImageField(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-hairline px-4 py-3">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Avatar
          src={user?.avatar}
          name={user?.name}
          size="h-10 w-10"
          textSize="text-base"
        />

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            rows={2}
            className="w-full resize-none border-none bg-transparent text-[20px] text-text placeholder:text-secondary outline-none"
          />

          {showImageField && (
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL"
              className="mt-2 w-full rounded-md border border-hairline bg-hover px-3 py-2 text-sm text-text placeholder:text-secondary outline-none focus:shadow-[0_0_0_1px_#1d9bf0]"
            />
          )}

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

          <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
            <button
              type="button"
              onClick={() => setShowImageField((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full text-x-blue hover:bg-x-blue/10 cursor-pointer"
              aria-label="Add image URL"
            >
              <Image size={20} />
            </button>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs ${isOverLimit ? "text-red-500" : "text-secondary"}`}
              >
                {remaining}
              </span>
              <Button
                type="submit"
                disabled={loading || !content.trim() || isOverLimit}
              >
                {loading ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

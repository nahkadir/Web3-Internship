import { useState } from "react";
import Button from "./Button";
import { updatePost } from "../api/posts";

export default function EditPostModal({ post, onClose, onUpdated }) {
  const [content, setContent] = useState(post.content);
  const [imageUrl, setImageUrl] = useState(post.imageUrl || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Content cannot be empty");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { post: updated } = await updatePost(post.id, {
        content: content.trim(),
        imageUrl: imageUrl.trim(),
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-hairline bg-bg p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-text hover:bg-hover"
          >
            ✕
          </button>
          <span className="text-[15px] font-bold text-text">Edit post</span>
          <div className="w-8" />
        </div>

        <form onSubmit={handleSubmit} className="mt-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full resize-none border-none bg-transparent text-[15px] text-text outline-none"
          />
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
            className="mt-2 w-full rounded-md border border-hairline bg-hover px-3 py-2 text-sm text-text placeholder:text-secondary outline-none"
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

          <div className="mt-3 flex justify-end border-t border-hairline pt-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

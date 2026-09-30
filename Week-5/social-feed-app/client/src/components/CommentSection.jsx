import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import CommentItem from "./CommentItem";
import * as commentsApi from "../api/comments";

const MAX_LEN = 300;

export default function CommentSection({ postId, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    commentsApi
      .getComments(postId)
      .then((data) => setComments(data.comments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || text.length > MAX_LEN) return;
    setPosting(true);
    try {
      const { comment } = await commentsApi.createComment(postId, text.trim());
      setComments((prev) => [comment, ...prev]);
      onCountChange?.(1);
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleUpdate = async (id, content) => {
    const { comment } = await commentsApi.updateComment(id, content);
    setComments((prev) => prev.map((c) => (c.id === id ? comment : c)));
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await commentsApi.deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      onCountChange?.(-1);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="border-t border-hairline px-4 py-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Post your reply"
          className="flex-1 border-none bg-transparent text-sm text-text placeholder:text-secondary outline-none"
        />
        <button
          type="submit"
          disabled={posting || !text.trim() || text.length > MAX_LEN}
          className="grid h-8 w-8 place-items-center rounded-full text-x-blue hover:bg-x-blue/10 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Post reply"
        >
          <Send size={16} />
        </button>
      </form>

      {error && <p className="pb-2 text-xs text-red-500">{error}</p>}
      {loading && (
        <p className="py-2 text-sm text-secondary">Loading comments...</p>
      )}
      {!loading && comments.length === 0 && (
        <p className="py-2 text-sm text-secondary">No replies yet.</p>
      )}

      <div className="divide-y divide-hairline">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

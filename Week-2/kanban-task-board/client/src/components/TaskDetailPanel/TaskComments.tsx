import { useState, useEffect } from "react";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  type Comment,
} from "../../api/comments";
import { useAuth } from "../../context/AuthContext";

interface TaskCommentsProps {
  taskId: string;
  onError: () => void;
}

const TaskComments = ({ taskId, onError }: TaskCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const { user, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      if (!token) return;
      try {
        const data = await getComments(taskId, token);
        setComments(data);
      } catch (err) {
        // Non-critical, comments tab just stays empty
      }
    };
    fetchComments();
  }, [taskId, token]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !token || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const comment = await createComment(taskId, newComment, token);
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch (err) {
      onError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingContent.trim() || !token) return;
    try {
      const updated = await updateComment(commentId, editingContent, token);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? updated : c)),
      );
      setEditingCommentId(null);
    } catch (err) {
      onError();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;
    try {
      await deleteComment(commentId, token);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      onError();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {comments.length === 0 ? (
        <p className="text-white text-small">No comments yet</p>
      ) : (
        comments.map((comment) => (
          <div key={comment._id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-white text-small font-medium">
                {comment.author.name}
              </span>
              <span className="text-text-muted text-small">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>

            {editingCommentId === comment._id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  rows={2}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCommentId(null)}
                    className="text-white text-small"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateComment(comment._id)}
                    className="text-accent text-small font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-text-muted text-body">{comment.content}</p>
                {user && comment.author._id === user._id && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingCommentId(comment._id);
                        setEditingContent(comment.content);
                      }}
                      className="text-white cursor-pointer text-small"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="text-priority-high text-small cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))
      )}

      <div className="flex gap-2 mt-2 pt-4 border-t border-border">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-white text-body outline-none focus:border-border-hover"
        />
        <button
          onClick={handleAddComment}
          disabled={isSubmitting}
          className="bg-button text-white font-medium rounded-lg px-4 py-2 text-body cursor-pointer"
        >
          {isSubmitting ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default TaskComments;

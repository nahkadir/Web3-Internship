import { useState } from "react";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

const formatTime = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

export default function CommentItem({ comment, onUpdate, onDelete }) {
  const { user } = useAuth();
  const isOwner = user?.id === comment.author.id;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(comment.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await onUpdate(comment.id, value.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-3 py-3">
      <Avatar
        src={comment.author.avatar}
        name={comment.author.name}
        size="h-8 w-8"
        textSize="text-xs"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1 text-sm">
          <span className="font-bold text-text">{comment.author.name}</span>
          <span className="text-secondary">
            · {formatTime(comment.createdAt)}
          </span>
        </div>

        {editing ? (
          <div className="mt-1">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-md border border-hairline bg-hover px-2 py-1 text-sm text-text outline-none"
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-x-blue px-3 py-1 text-xs font-bold text-white hover:bg-x-blue-hover disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setValue(comment.content);
                }}
                className="rounded-full border border-hairline px-3 py-1 text-xs font-bold text-text hover:bg-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-text">
            {comment.content}
          </p>
        )}

        {isOwner && !editing && (
          <div className="mt-1 flex gap-3 text-xs text-secondary">
            <button
              onClick={() => setEditing(true)}
              className="hover:text-x-blue"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(comment.id)}
              className="hover:text-red-500"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

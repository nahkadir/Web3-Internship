// Reminder Day 5: Must refactor this code into smaller components, the file has grown to a large size & is difficult to read

import { useState, useEffect, useRef } from "react";
import { updateTask, deleteTask } from "../api/tasks";
import { getUsers, type User } from "../api/users";
import { useAuth } from "../context/AuthContext";
import type { Task } from "../../types";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  type Comment,
} from "../api/comments";
import { getActivity, type ActivityEntry } from "../api/activity";

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onError: () => void;
  onDeleted: (task: Task) => void;
}

type Tab = "description" | "comments" | "activity";

const priorityStyles = {
  high: { label: "High", text: "text-priority-high" },
  medium: { label: "Medium", text: "text-priority-medium" },
  low: { label: "Low", text: "text-priority-low" },
};

const statusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const activityLabels: Record<string, string> = {
  created: "created this task",
  assigned: "changed the assignee",
  status_changed: "changed the status",
  priority_changed: "changed the priority",
  due_date_changed: "changed the due date",
  updated: "updated this task",
  comment_added: "added a comment",
  deleted: "deleted this task",
};

const formatActivity = (entry: ActivityEntry) => {
  const label = activityLabels[entry.action] || entry.action;
  if (entry.previousValue && entry.newValue) {
    return `${label}: ${entry.previousValue} → ${entry.newValue}`;
  }
  return label;
};

const TaskDetailPanel = ({
  task,
  onClose,
  onUpdated,
  onError,
  onDeleted,
}: TaskDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [priority, setPriority] = useState<Task["priority"]>(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : "",
  );
  const [assignedUser, setAssignedUser] = useState(task.assignedUser || "");
  const [users, setUsers] = useState<User[]>([]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const { user, token } = useAuth();

  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        const data = await getUsers(token);
        setUsers(data);
      } catch (err) {
        // Non-critical
      }
    };
    fetchUsers();
  }, [token]);

  useEffect(() => {
    const fetchLatest = async () => {
      if (!token) return;
      try {
        const res = await fetch(`http://localhost:5000/api/tasks/${task._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setTitle(data.title);
          setDescription(data.description);
          setStatus(data.status);
          setPriority(data.priority);
          setDueDate(data.dueDate ? data.dueDate.slice(0, 10) : "");
          setAssignedUser(data.assignedUser || "");
        }
      } catch (err) {
        // fall back silently to prop data
      }
    };
    fetchLatest();
  }, [task._id, token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      if (!token) return;
      try {
        const data = await getComments(task._id, token);
        setComments(data);
      } catch (err) {
        // Non-critical, comments tab just stays empty
      }
    };
    fetchComments();
  }, [task._id, token]);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!token) return;
      try {
        const data = await getActivity(task._id, token);
        setActivity(data);
      } catch (err) {
        // Non-critical
      }
    };
    fetchActivity();
  }, [task._id, token]);

  const assignedUserName = users.find((u) => u._id === assignedUser)?.name;

  const handleSave = async () => {
    if (!token) return;

    const optimisticTask: Task = {
      ...task,
      title,
      description,
      status,
      priority,
      dueDate: dueDate || null,
      assignedUser: assignedUser || null,
    };

    onUpdated(optimisticTask);
    setIsEditing(false);

    try {
      await updateTask(
        task._id,
        {
          title,
          description,
          status,
          priority,
          dueDate: dueDate || undefined,
          assignedUser: assignedUser || undefined,
        },
        token,
      );
    } catch (err) {
      onUpdated(task);
      onError();
    }
  };

  const handleCancelEdit = () => {
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setAssignedUser(task.assignedUser || "");
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!token) return;
    const confirmed = window.confirm(
      `Delete "${task.title}"? This can't be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteTask(task._id, token);
      onDeleted(task);
      onClose();
    } catch (err) {
      onError();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !token) return;
    try {
      const comment = await createComment(task._id, newComment, token);
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch (err) {
      onError();
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
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-105 bg-card border-l border-border z-50 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing((v) => !v)}
              className="text-white hover:text-text w-7 h-7 rounded-md flex items-center justify-center"
              title="Edit"
            >
              ✎
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="text-white hover:text-text w-7 h-7 rounded-md flex items-center justify-center"
                title="More"
              >
                ⋯
              </button>
              {menuOpen && (
                <div className="absolute top-8 left-0 bg-bg border border-border rounded-lg py-1 w-32 shadow-md">
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-2 text-small text-priority-high hover:bg-priority-high/10"
                  >
                    Delete task
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-text w-7 h-7 rounded-md flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 border-b border-border">
          {isEditing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-text text-h4 font-medium bg-bg border border-border rounded-lg px-3 py-2 w-full outline-none focus:border-border-hover"
            />
          ) : (
            <h2 className="text-white text-h3 font-medium">{title}</h2>
          )}
        </div>

        <div className="px-5 py-4 border-b border-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-body">Assignee</span>
            {isEditing ? (
              <select
                value={assignedUser}
                onChange={(e) => setAssignedUser(e.target.value)}
                className="bg-bg border border-border rounded-lg px-2 py-1 text-text text-body outline-none"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-white text-body">
                {assignedUserName || "Unassigned"}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted text-body">Status</span>
            {isEditing ? (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
                className="bg-bg border border-border rounded-lg px-2 py-1 text-text text-body outline-none"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            ) : (
              <span className="text-white text-body">
                {statusLabels[status]}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted text-body">Due Date</span>
            {isEditing ? (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-bg border border-border rounded-lg px-2 py-1 text-text text-body outline-none"
              />
            ) : (
              <span className="text-white text-body">
                {dueDate ? new Date(dueDate).toLocaleDateString() : "None"}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted text-body">Priority</span>
            {isEditing ? (
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Task["priority"])
                }
                className="bg-bg border border-border rounded-lg px-2 py-1 text-text text-body outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            ) : (
              <span
                className={`text-body font-medium ${priorityStyles[priority].text}`}
              >
                {priorityStyles[priority].label}
              </span>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCancelEdit}
                className="flex-1 border border-border text-text rounded-lg py-1.5 text-small"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-accent text-bg font-medium rounded-lg py-1.5 text-small"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="flex border-b border-border px-5">
          {(["description", "comments", "activity"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-small capitalize border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-text border-accent"
                  : "text-text-muted border-transparent hover:text-text"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === "description" &&
            (isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body outline-none focus:border-border-hover resize-none w-full"
              />
            ) : (
              <p className="text-text-muted text-body">
                {description || "No description"}
              </p>
            ))}

          {/* COMMENTS */}

          {activeTab === "comments" && (
            <div className="flex flex-col gap-4">
              {comments.length === 0 ? (
                <p className="text-text-muted text-small">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-text text-small font-medium">
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
                            className="text-text-muted text-small"
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
                        <p className="text-text-muted text-body">
                          {comment.content}
                        </p>
                        {user && comment.author._id === user._id && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setEditingCommentId(comment._id);
                                setEditingContent(comment.content);
                              }}
                              className="text-text-muted hover:text-text text-small"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-text-muted hover:text-priority-high text-small"
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
                  className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-text text-body outline-none focus:border-border-hover"
                />
                <button
                  onClick={handleAddComment}
                  className="bg-accent text-bg font-medium rounded-lg px-4 py-2 text-body"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="flex flex-col gap-3">
              {activity.length === 0 ? (
                <p className="text-text-muted text-small">No activity yet</p>
              ) : (
                activity.map((entry) => (
                  <div key={entry._id} className="flex flex-col gap-0.5">
                    <p className="text-text-muted text-small">
                      <span className="text-text font-medium">
                        {entry.user.name}
                      </span>{" "}
                      {formatActivity(entry)}
                    </p>
                    <span className="text-text-muted text-small opacity-60">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TaskDetailPanel;

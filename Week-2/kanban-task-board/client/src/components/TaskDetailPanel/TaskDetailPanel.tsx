import { useState, useEffect, useRef } from "react";
import { updateTask, deleteTask } from "../../api/tasks";
import { getUsers, type User } from "../../api/users";
import { useAuth } from "../../context/AuthContext";
import type { Task } from "../../../types";
import TaskComments from "./TaskComments";
import TaskActivity from "./TaskActivity";

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

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { token } = useAuth();

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
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tasks/${task._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
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

  const assignedUserName = users.find((u) => u._id === assignedUser)?.name;

  const handleSave = async () => {
    if (!token || isSaving) return;
    setIsSaving(true);

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

    setIsSaving(false);
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
    if (!token || isDeleting) return;
    const confirmed = window.confirm(
      `Delete "${task.title}"? This can't be undone.`,
    );
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await deleteTask(task._id, token);
      onDeleted(task);
      onClose();
    } catch (err) {
      onError();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-105 bg-card border-l border-border z-50 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4">
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

        <div className="px-5 py-4">
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

        <div className="px-5 py-4 flex flex-col gap-5">
          <div className="flex items-center gap-12">
            <span className="text-text-muted text-body w-20">Assignee</span>
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

          <div className="flex items-center gap-12">
            <span className="text-text-muted text-body w-20">Status</span>
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

          <div className="flex items-center gap-12">
            <span className="text-text-muted text-body w-20">Due Date</span>
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

          <div className="flex items-center gap-12 ">
            <span className="text-text-muted text-body w-20">Priority</span>
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
                className="flex-1 border border-gray-400/50 text-white cursor-pointer rounded-lg py-2 text-body"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-button text-white cursor-pointer rounded-lg py-2 text-body"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-around border-b mt-4 border-border px-5">
          {(["description", "comments", "activity"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-small capitalize border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-white border-button"
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
              <p className="text-white text-body">
                {description || "No description"}
              </p>
            ))}

          {activeTab === "comments" && (
            <TaskComments taskId={task._id} onError={onError} />
          )}

          {activeTab === "activity" && <TaskActivity taskId={task._id} />}
        </div>
      </div>
    </>
  );
};

export default TaskDetailPanel;

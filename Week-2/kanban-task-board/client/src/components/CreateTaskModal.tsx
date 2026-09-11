import { useState, useEffect, type FormEvent } from "react";
import { createTask } from "../api/tasks";
import { getUsers, type User } from "../api/users";
import { useAuth } from "../context/AuthContext";
import type { Task } from "../../types";

interface CreateTaskModalProps {
  onClose: () => void;
  onCreated: (task: Task) => void;
  defaultStatus: Task["status"];
}

const CreateTaskModal = ({
  onClose,
  onCreated,
  // defaultStatus,
}: CreateTaskModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  // const [status, setStatus] = useState<Task["status"]>(defaultStatus);
  const [dueDate, setDueDate] = useState("");
  const [assignedUser, setAssignedUser] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        const data = await getUsers(token);
        setUsers(data);
      } catch (err) {
        // Non-critical — form still works without assignee list
      }
    };
    fetchUsers();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!token) return;

    setLoading(true);
    try {
      const newTask = await createTask(
        {
          title,
          description,
          priority,
          // status,
          dueDate: dueDate || undefined,
          assignedUser: assignedUser || undefined,
        },
        token,
      );
      onCreated(newTask);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
        <h2 className="text-text text-h4 font-medium mb-4">New task</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="text-priority-high text-small bg-priority-high/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-text-muted text-small">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body outline-none focus:border-border-hover"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-text-muted text-small">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body outline-none focus:border-border-hover resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-text-muted text-small">Priority</label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "low" | "medium" | "high")
                }
                className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body outline-none focus:border-border-hover"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1">
              <label className="text-text-muted text-small">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body outline-none focus:border-border-hover"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-text-muted text-small">Assign to</label>
            <select
              value={assignedUser}
              onChange={(e) => setAssignedUser(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body outline-none focus:border-border-hover"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border text-text rounded-lg py-2 text-body"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent text-bg font-medium rounded-lg py-2 text-body disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;

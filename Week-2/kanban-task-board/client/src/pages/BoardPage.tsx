import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import KanbanBoard from "../components/KanbanBoard";
import CreateTaskModal from "../components/CreateTaskModal";
import TaskDetailPanel from "../components/TaskDetailPanel";
import Toast from "../components/Toast";
import { getTasks, deleteTask, type TaskFilters } from "../api/tasks";
import { useAuth } from "../context/AuthContext";
import type { Task } from "../../types";
import { getUsers, type User } from "../api/users";

function BoardPage() {
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    getUsers(token)
      .then(setUsers)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!token) return;
      try {
        const data = await getTasks(token, filters);
        setTasks(data);
      } catch (err) {
        setToast({ message: "Failed to load tasks", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [token, filters]);

  if (!user) return null;

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
    setToast({ message: "Task created successfully", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTaskUpdated = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    setToast({ message: "Task updated successfully", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteClick = async (task: Task) => {
    if (!token) return;
    const confirmed = window.confirm(
      `Delete "${task.title}"? This can't be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteTask(task._id, token);
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
      setToast({ message: "Task deleted", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: "Failed to delete task", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="flex bg-bg h-screen overflow-hidden">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-h1 font-semibold mb-6 text-white">Dashboard</h1>

        {loading ? (
          <p className="text-text-muted text-body my-4">Loading tasks...</p>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onAddClick={() => setShowModal(true)}
            onTaskClick={(task) => setEditingTask(task)}
            onDeleteClick={handleDeleteClick}
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters({})}
            users={users}
          />
        )}
      </main>

      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreated={handleTaskCreated}
        />
      )}
      {editingTask && (
        <TaskDetailPanel
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdated={handleTaskUpdated}
          onError={() => {
            setToast({
              message: "Failed to save changes — reverted",
              type: "error",
            });
            setTimeout(() => setToast(null), 3000);
          }}
          onDeleted={(task) => {
            setTasks((prev) => prev.filter((t) => t._id !== task._id));
            setToast({ message: "Task deleted", type: "success" });
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default BoardPage;

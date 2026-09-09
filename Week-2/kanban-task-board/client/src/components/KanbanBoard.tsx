import TaskCard from "./TaskCard";
import type { Task } from "../../types";

const columns = [
  { key: "todo", label: "TO DO", dot: "bg-status-todo" },
  { key: "in-progress", label: "IN PROGRESS", dot: "bg-status-progress" },
  { key: "done", label: "DONE", dot: "bg-status-done" },
] as const;

interface KanbanBoardProps {
  tasks: Task[];
  onAddClick: (status: Task["status"]) => void;
  onTaskClick: (task: Task) => void;
  onDeleteClick: (task: Task) => void;
}

const KanbanBoard = ({
  tasks,
  onAddClick,
  onTaskClick,
  onDeleteClick,
}: KanbanBoardProps) => {
  return (
    <div className="grid grid-cols-3 gap-6">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div key={col.key}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <h2 className="text-text font-medium text-body select-none">
                  {col.label}
                </h2>
                <span className="text-white text-small bg-card px-2 py-0.5 rounded-md select-none">
                  {columnTasks.length}
                </span>
              </div>
              <button
                onClick={() => onAddClick(col.key)}
                className="text-white hover:text-text bg-card w-6 h-6 rounded-md flex items-center justify-center text-body cursor-pointer"
              >
                +
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {columnTasks.length === 0 ? (
                <p className="text-text-muted text-small">No tasks yet</p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onDelete={() => onDeleteClick(task)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;

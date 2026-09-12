import type { Task } from "../../types";

const priorityStyles = {
  high: {
    label: "High",
    bg: "bg-priority-high/15",
    text: "text-priority-high",
  },
  medium: {
    label: "Medium",
    bg: "bg-priority-medium/15",
    text: "text-priority-medium",
  },
  low: { label: "Low", bg: "bg-priority-low/15", text: "text-priority-low" },
};

const urgencyStyles = {
  overdue: { label: "Overdue", bg: "bg-priority-high", text: "text-white" },
  soon: { label: "Due soon", bg: "bg-priority-medium", text: "text-bg" },
};

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
}

const getUrgency = (dueDate: string | null, status: Task["status"]) => {
  if (!dueDate || status === "done") return null;

  const due = new Date(dueDate);
  const now = new Date();
  const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDue < 0) return "overdue";
  if (hoursUntilDue <= 48) return "soon";
  return null;
};

const TaskCard = ({ task, onClick, onDelete }: TaskCardProps) => {
  const urgency = getUrgency(task.dueDate, task.status);
  const priority = priorityStyles[task.priority];

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-border-hover transition-all cursor-pointer relative group"
    >
      <button
        onClick={handleDeleteClick}
        className="absolute top-3 right-3 text-text-muted hover:text-priority-high opacity-0 group-hover:opacity-100 transition-opacity text-small"
      >
        ✕
      </button>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-block text-xs font-medium px-2 py-1 rounded-md ${priority.bg} ${priority.text}`}
        >
          {priority.label}
        </span>

        {urgency && (
          <span
            className={`inline-block text-xs font-medium px-2 py-1 rounded-md ${urgencyStyles[urgency].bg} ${urgencyStyles[urgency].text}`}
          >
            {urgencyStyles[urgency].label}
          </span>
        )}
      </div>

      <h3 className="text-white text-sm font-medium mt-3 leading-snug pr-4">
        {task.title}
      </h3>

      {task.description && (
        <p className="text-white text-small mt-1.5 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.dueDate && (
        <p className="text-text text-small mt-3">
          Due Date:{" "}
          <span className="text-text-muted">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        </p>
      )}
    </div>
  );
};

export default TaskCard;

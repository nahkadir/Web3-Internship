import type { Task } from "../../types";
import { RiArrowUpDoubleLine, RiArrowDownDoubleLine } from "react-icons/ri";
import { BsDot } from "react-icons/bs";

const priorityStyles = {
  high: {
    label: "High",
    bg: "bg-priority-high/15",
    text: "text-priority-high",
    icon: RiArrowUpDoubleLine,
  },
  medium: {
    label: "Medium",
    bg: "bg-priority-medium/15",
    text: "text-priority-medium",
    icon: BsDot,
  },
  low: {
    label: "Low",
    bg: "bg-priority-low/15",
    text: "text-priority-low",
    icon: RiArrowDownDoubleLine,
  },
};

const urgencyStyles = {
  overdue: { label: "Overdue", text: "text-priority-high" },
  soon: { label: "Due soon", text: "text-priority-medium" },
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
          className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-md ${priority.bg} ${priority.text}`}
        >
          <priority.icon size={20} />
          {priority.label}
        </span>
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
          {urgency && (
            <span className={`ml-2 font-medium ${urgencyStyles[urgency].text}`}>
              {urgencyStyles[urgency].label}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

export default TaskCard;

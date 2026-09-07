import type { Task, Priority } from "../../types.ts";

interface PriorityStyle {
  label: string;
  bg: string;
  text: string;
}

const priorityStyles: Record<Priority, PriorityStyle> = {
  high: { label: "High", bg: "bg-[#FF4D6D]/15", text: "text-[#FF4D6D]" },
  medium: { label: "Medium", bg: "bg-[#FFB020]/15", text: "text-[#FFB020]" },
  low: { label: "Low", bg: "bg-[#4DA3FF]/15", text: "text-[#4DA3FF]" },
};

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  const priority = priorityStyles[task.priority];

  return (
    <div className="bg-[#1C1D21] border border-[#2A2B30] rounded-xl p-4 hover:border-[#3A3B42] transition-colors cursor-pointer">
      <span
        className={`inline-block text-xs font-medium px-2 py-1 rounded-md ${priority.bg} ${priority.text}`}
      >
        {priority.label}
      </span>
      <h3 className="text-[#F2F2F3] text-sm font-medium mt-3 leading-snug">
        {task.title}
      </h3>
    </div>
  );
};

export default TaskCard;

import TaskCard from "./TaskCard";
import type { Task, Status } from "../../types.ts";

interface Column {
  key: Status;
  label: string;
  dot: string;
}

const columns: Column[] = [
  { key: "todo", label: "TO DO", dot: "bg-[#8B8D98]" },
  { key: "in-progress", label: "IN PROGRESS", dot: "bg-[#B388FF]" },
  { key: "done", label: "DONE", dot: "bg-[#34D399]" },
];

interface KanbanBoardProps {
  tasks: Task[];
}

const KanbanBoard = ({ tasks }: KanbanBoardProps) => {
  return (
    <div className="grid grid-cols-3 gap-6">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div key={col.key}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <h2 className="text-text font-medium text-sm">{col.label}</h2>
              <span className="text-[#8B8D98] text-xs bg-card px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {columnTasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;

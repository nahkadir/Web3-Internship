import { useState } from "react";
import TaskCard from "./TaskCard";
import type { Task } from "../../types";
import type { TaskFilters } from "../api/tasks";
import type { User } from "../api/users";
import FilterBar from "./FilterBar";

const columns = [
  { key: "todo", label: "TO DO", dot: "bg-status-todo" },
  { key: "in-progress", label: "IN PROGRESS", dot: "bg-status-progress" },
  { key: "done", label: "DONE", dot: "bg-status-done" },
] as const;

type SortOption = "dueDate" | "priority" | "updated";

const priorityRank = { high: 0, medium: 1, low: 2 };

const sortTasks = (tasks: Task[], sortBy: SortOption): Task[] => {
  const sorted = [...tasks];

  if (sortBy === "dueDate") {
    sorted.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  } else if (sortBy === "priority") {
    sorted.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  } else if (sortBy === "updated") {
    sorted.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  return sorted;
};

interface KanbanBoardProps {
  tasks: Task[];
  onAddClick: (status: Task["status"]) => void;
  onTaskClick: (task: Task) => void;
  onDeleteClick: (task: Task) => void;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onClearFilters: () => void;
  users: User[];
}

const KanbanBoard = ({
  tasks,
  onAddClick,
  onTaskClick,
  onDeleteClick,
  filters,
  onFiltersChange,
  onClearFilters,
  users,
}: KanbanBoardProps) => {
  const [sortBy, setSortBy] = useState<SortOption>("dueDate");
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    filters.priority || filters.assignedTo || filters.status || filters.search;

  return (
    <div>
      <div className="flex items-center justify-between my-4">
        <div className="relative">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-2 b px-3 py-1 text-white hover:text-text text-small cursor-pointer"
          >
            <span>⇅</span>
            Filter
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </button>

          {showFilters && (
            <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg p-4 z-30 shadow-md">
              <FilterBar
                filters={filters}
                onChange={onFiltersChange}
                onClear={onClearFilters}
                users={users}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-white text-small">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-card border border-border rounded-lg px-2 py-1 text-white text-small outline-none"
          >
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="updated">Recently updated</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {columns.map((col) => {
          const columnTasks = sortTasks(
            tasks.filter((t) => t.status === col.key),
            sortBy,
          );
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
    </div>
  );
};

export default KanbanBoard;

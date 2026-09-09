import type { TaskFilters } from "../api/tasks";
import type { User } from "../api/users";

interface FilterBarProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  onClear: () => void;
  users: User[];
}

const FilterBar = ({ filters, onChange, onClear, users }: FilterBarProps) => {
  const update = (key: keyof TaskFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="Search title/description..."
        value={filters.search || ""}
        onChange={(e) => update("search", e.target.value)}
        className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body"
      />

      <select
        value={filters.priority || ""}
        onChange={(e) => update("priority", e.target.value)}
        className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body"
      >
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <select
        value={filters.status || ""}
        onChange={(e) => update("status", e.target.value)}
        className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body"
      >
        <option value="">All statuses</option>
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <select
        value={filters.assignedTo || ""}
        onChange={(e) => update("assignedTo", e.target.value)}
        className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body"
      >
        <option value="">All assignees</option>
        {users.map((u) => (
          <option key={u._id} value={u._id}>
            {u.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={filters.dueFrom || ""}
        onChange={(e) => update("dueFrom", e.target.value)}
        className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body"
      />
      <input
        type="date"
        value={filters.dueTo || ""}
        onChange={(e) => update("dueTo", e.target.value)}
        className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body"
      />

      <button
        onClick={onClear}
        className="border border-border text-text rounded-lg px-3 py-2 text-body"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default FilterBar;

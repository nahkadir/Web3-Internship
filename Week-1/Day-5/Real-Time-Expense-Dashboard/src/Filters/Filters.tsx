import { useFilters } from "../context/FilterContext";
import type { TransactionCategory } from "../types";

const categories: TransactionCategory[] = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Salary",
  "Other",
];

const Filters = () => {
  const { filters, setFilter, resetFilters } = useFilters();

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Search description..."
        value={filters.search}
        onChange={(e) => setFilter("search", e.target.value)}
        className="bg-grey min-w-45 flex-1 rounded-xl p-3 outline-none"
      />

      <select
        value={filters.category}
        onChange={(e) => setFilter("category", e.target.value)}
        className="bg-grey rounded-xl p-3 text-gray-500 outline-none"
      >
        <option>All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={filters.type}
        onChange={(e) => setFilter("type", e.target.value)}
        className="bg-grey rounded-xl p-3 text-gray-500 outline-none"
      >
        <option>All types</option>
        <option>Income</option>
        <option>Expense</option>
      </select>

      <input
        type="date"
        value={filters.startDate}
        onChange={(e) => setFilter("startDate", e.target.value)}
        className="bg-grey rounded-xl p-3 text-gray-500 outline-none"
      />
      <input
        type="date"
        value={filters.endDate}
        onChange={(e) => setFilter("endDate", e.target.value)}
        className="bg-grey rounded-xl p-3 text-gray-500 outline-none"
      />

      <input
        type="number"
        placeholder="Min amount"
        value={filters.minAmount}
        onChange={(e) => setFilter("minAmount", e.target.value)}
        className="bg-grey w-28 rounded-xl p-3 text-gray-500 outline-none"
      />
      <input
        type="number"
        placeholder="Max amount"
        value={filters.maxAmount}
        onChange={(e) => setFilter("maxAmount", e.target.value)}
        className="bg-grey w-28 rounded-xl p-3 text-gray-500 outline-none"
      />

      <button
        type="button"
        onClick={resetFilters}
        className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-500"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default Filters;

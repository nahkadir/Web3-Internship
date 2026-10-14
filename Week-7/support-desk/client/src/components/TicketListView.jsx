import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import useTickets from "../hooks/useTickets";
import { StatusBadge, PriorityBadge } from "./Badges";
import { STATUSES, PRIORITIES, CATEGORIES, label } from "../constants/ticket";

const initial = {
  search: "",
  status: "",
  priority: "",
  category: "",
  assignedTo: "",
  from: "",
  to: "",
  sort: "createdAt:desc",
  page: 1,
};

const SORTS = [
  ["createdAt:desc", "Newest first"],
  ["createdAt:asc", "Oldest first"],
  ["priority:desc", "Highest priority"],
  ["priority:asc", "Lowest priority"],
  ["updatedAt:desc", "Recently updated"],
];

const input = "border rounded-lg px-3 py-2 text-sm bg-white";

export default function TicketListView({
  endpoint,
  isAdmin = false,
  showCustomer = false,
}) {
  const [filters, setFilters] = useState(initial);
  const [agents, setAgents] = useState([]);
  const [sortBy, order] = filters.sort.split(":");

  const { tickets, pagination, loading, error } = useTickets(endpoint, {
    ...filters,
    sortBy,
    order,
    sort: undefined,
    limit: 10,
  });

  useEffect(() => {
    if (!isAdmin) return;
    api
      .get("/admin/users", { params: { role: "AGENT", limit: 100 } })
      .then((res) => setAgents(res.data.data.users))
      .catch(() => {});
  }, [isAdmin]);

  const set = (name) => (e) =>
    setFilters((f) => ({ ...f, [name]: e.target.value, page: 1 }));
  const goTo = (page) => setFilters((f) => ({ ...f, page }));

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className={`${input} lg:col-span-2`}
          placeholder="Search by ticket number or subject"
          value={filters.search}
          onChange={set("search")}
        />
        <select
          className={input}
          value={filters.status}
          onChange={set("status")}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <select
          className={input}
          value={filters.priority}
          onChange={set("priority")}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {label(p)}
            </option>
          ))}
        </select>
        <select
          className={input}
          value={filters.category}
          onChange={set("category")}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {label(c)}
            </option>
          ))}
        </select>
        {isAdmin && (
          <select
            className={input}
            value={filters.assignedTo}
            onChange={set("assignedTo")}
          >
            <option value="">Any agent</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          className={input}
          value={filters.from}
          onChange={set("from")}
          title="Created from"
        />
        <input
          type="date"
          className={input}
          value={filters.to}
          onChange={set("to")}
          title="Created to"
        />
        <select className={input} value={filters.sort} onChange={set("sort")}>
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button
          onClick={() => setFilters(initial)}
          className="text-sm text-indigo-600 text-left"
        >
          Clear filters
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-3">Ticket</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Status</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Category</th>
              {showCustomer && <th className="p-3">Customer</th>}
              <th className="p-3">Assigned to</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono">
                  <Link to={`/tickets/${t._id}`} className="text-indigo-600">
                    {t.ticketNumber}
                  </Link>
                </td>
                <td className="p-3 max-w-xs truncate">{t.subject}</td>
                <td className="p-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="p-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="p-3">{label(t.category)}</td>
                {showCustomer && <td className="p-3">{t.createdBy?.name}</td>}
                <td className="p-3">
                  {t.assignedTo?.name || (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && tickets.length === 0 && (
          <p className="p-6 text-center text-gray-500">No tickets found.</p>
        )}
        {loading && (
          <p className="p-6 text-center text-gray-500">Loading tickets...</p>
        )}

        <div className="flex items-center justify-between p-4 border-t text-sm">
          <button
            disabled={pagination.page <= 1}
            onClick={() => goTo(pagination.page - 1)}
            className="px-3 py-1 border rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages} · {pagination.total}{" "}
            tickets
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => goTo(pagination.page + 1)}
            className="px-3 py-1 border rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

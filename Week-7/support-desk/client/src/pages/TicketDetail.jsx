import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "../components/Badges";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  CATEGORIES,
  PRIORITIES,
  TERMINAL,
  label,
  statusAction,
} from "../constants/ticket";
import { ROLE_HOME } from "../constants/roles";
import { getErrorMessage } from "../utils/getErrorMessage";

const input = "w-full border rounded-lg px-3 py-2 text-sm bg-white";

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user.role === "ADMIN";
  const backTo = isAdmin ? "/admin/tickets" : ROLE_HOME[user.role];

  const [ticket, setTicket] = useState(null);
  const [form, setForm] = useState({});
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get(`/tickets/${id}`)
      .then((res) => setTicket(res.data.data.ticket))
      .catch((err) => setLoadError(getErrorMessage(err)));
  }, [id]);

  useEffect(() => {
    if (!ticket) return;
    setForm({
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
    });
    setAgentId(ticket.assignedTo?._id || "");
  }, [ticket]);

  useEffect(() => {
    if (!isAdmin) return;
    api
      .get("/admin/users", { params: { role: "AGENT", limit: 100 } })
      .then((res) => setAgents(res.data.data.users))
      .catch(() => {});
  }, [isAdmin]);

  const run = async (request) => {
    setBusy(true);
    setActionError("");
    try {
      const res = await request();
      setTicket(res.data.data.ticket);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changes = ticket
    ? Object.fromEntries(
        ticket.editableFields
          .filter((f) => form[f] !== ticket[f])
          .map((f) => [f, form[f]]),
      )
    : {};
  const hasChanges = Object.keys(changes).length > 0;
  const canEdit = (f) => ticket.editableFields.includes(f);

  return (
    <DashboardLayout title="Ticket Details">
      <Link to={backTo} className="text-sm text-indigo-600 inline-block mb-4">
        ← Back to tickets
      </Link>

      {loadError && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {loadError}
        </p>
      )}
      {!ticket && !loadError && <p className="text-gray-500">Loading...</p>}

      {ticket && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-gray-500">
                {ticket.ticketNumber}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>

            {actionError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {actionError}
              </p>
            )}

            {canEdit("subject") ? (
              <input
                className={input}
                value={form.subject || ""}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            ) : (
              <h2 className="text-xl font-semibold">{ticket.subject}</h2>
            )}

            {canEdit("description") ? (
              <textarea
                rows={6}
                className={input}
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {ticket.description}
              </p>
            )}

            {(canEdit("category") || canEdit("priority")) && (
              <div className="grid grid-cols-2 gap-3">
                {canEdit("category") && (
                  <select
                    className={input}
                    value={form.category || ""}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {label(c)}
                      </option>
                    ))}
                  </select>
                )}
                {canEdit("priority") && (
                  <select
                    className={input}
                    value={form.priority || ""}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {label(p)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {ticket.editableFields.length > 0 && (
              <button
                disabled={!hasChanges || busy}
                onClick={() => run(() => api.patch(`/tickets/${id}`, changes))}
                className="bg-indigo-600 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
              >
                Save changes
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow text-sm space-y-2">
              <h3 className="font-semibold">Details</h3>
              <p>
                <span className="text-gray-500">Category:</span>{" "}
                {label(ticket.category)}
              </p>
              <p>
                <span className="text-gray-500">Created:</span>{" "}
                {new Date(ticket.createdAt).toLocaleString()}
              </p>
              <p>
                <span className="text-gray-500">Updated:</span>{" "}
                {new Date(ticket.updatedAt).toLocaleString()}
              </p>
              {ticket.resolvedAt && (
                <p>
                  <span className="text-gray-500">Resolved:</span>{" "}
                  {new Date(ticket.resolvedAt).toLocaleString()}
                </p>
              )}
              {user.role !== "CUSTOMER" && (
                <p>
                  <span className="text-gray-500">Customer:</span>{" "}
                  {ticket.createdBy?.name} ({ticket.createdBy?.email})
                </p>
              )}
              <p>
                <span className="text-gray-500">Assigned to:</span>{" "}
                {ticket.assignedTo?.name || "Unassigned"}
              </p>
            </div>

            {ticket.allowedStatuses.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow space-y-2">
                <h3 className="font-semibold text-sm">Actions</h3>
                {ticket.allowedStatuses.map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        api.patch(`/tickets/${id}/status`, { status: s }),
                      )
                    }
                    className="w-full text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {statusAction(s)}
                  </button>
                ))}
              </div>
            )}

            {isAdmin && !TERMINAL.includes(ticket.status) && (
              <div className="bg-white p-6 rounded-xl shadow space-y-2">
                <h3 className="font-semibold text-sm">Assign agent</h3>
                <select
                  className={input}
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                >
                  <option value="">Select an agent</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={
                    busy || !agentId || agentId === ticket.assignedTo?._id
                  }
                  onClick={() =>
                    run(() =>
                      api.patch(`/admin/tickets/${id}/assign`, { agentId }),
                    )
                  }
                  className="w-full text-sm bg-gray-900 text-white rounded-lg px-3 py-2 disabled:opacity-50"
                >
                  {ticket.assignedTo ? "Reassign" : "Assign"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

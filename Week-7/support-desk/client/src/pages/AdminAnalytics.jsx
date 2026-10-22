import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import { formatDuration } from "../utils/formatDuration";
import { getErrorMessage } from "../utils/getErrorMessage";
import { label } from "../constants/ticket";

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => iso(new Date(Date.now() - n * 86400000));
const input = "border rounded-lg px-3 py-2 text-sm bg-white";

const Card = ({ title, value, tone = "" }) => (
  <div className="bg-white p-4 rounded-xl shadow">
    <p className="text-xs text-gray-500">{title}</p>
    <p className={`text-2xl font-semibold mt-1 ${tone}`}>{value}</p>
  </div>
);

const Chart = ({ title, children }) => (
  <div className="bg-white p-4 rounded-xl shadow">
    <h3 className="text-sm font-semibold mb-3">{title}</h3>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

const pct = (v) => (v == null ? "—" : `${v}%`);

export default function AdminAnalytics() {
  const [range, setRange] = useState({
    from: daysAgo(30),
    to: iso(new Date()),
    groupBy: "day",
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    const params = {
      from: range.from || undefined,
      to: range.to || undefined,
      groupBy: range.groupBy,
    };

    Promise.all([
      api.get("/admin/analytics/overview", { params }),
      api.get("/admin/analytics/tickets", { params }),
      api.get("/admin/analytics/agents", { params }),
      api.get("/admin/analytics/sla", { params }),
    ])
      .then(([o, t, a, s]) => {
        if (ignore) return;
        setData({
          overview: o.data.data,
          tickets: t.data.data,
          agents: a.data.data.agents,
          sla: s.data.data,
        });
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [range]);

  const set = (name) => (e) =>
    setRange((r) => ({ ...r, [name]: e.target.value }));
  const preset = (days) =>
    setRange((r) => ({ ...r, from: daysAgo(days), to: iso(new Date()) }));

  const o = data?.overview;

  return (
    <DashboardLayout title="Analytics">
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <Link to="/admin" className="text-indigo-600">
          ← Users
        </Link>
        <Link to="/admin/tickets" className="text-indigo-600">
          Tickets
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow flex flex-wrap items-end gap-3 mb-4">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => preset(d)}
            className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
          >
            Last {d} days
          </button>
        ))}
        <label className="text-xs text-gray-500">
          From
          <input
            type="date"
            value={range.from}
            onChange={set("from")}
            className={`${input} block`}
          />
        </label>
        <label className="text-xs text-gray-500">
          To
          <input
            type="date"
            value={range.to}
            onChange={set("to")}
            className={`${input} block`}
          />
        </label>
        <label className="text-xs text-gray-500">
          Group by
          <select
            value={range.groupBy}
            onChange={set("groupBy")}
            className={`${input} block`}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
          {error}
        </p>
      )}
      {loading && (
        <p className="text-center text-gray-500 py-10">Loading analytics...</p>
      )}

      {!loading && o && o.total === 0 && (
        <p className="text-center text-gray-500 py-10">
          No tickets were created in this date range.
        </p>
      )}

      {!loading && o && o.total > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card title="Total tickets" value={o.total} />
            <Card title="Open" value={o.open} />
            <Card title="Unresolved" value={o.unresolved} />
            <Card title="Resolved" value={o.resolved} />
            <Card
              title="Overdue now"
              value={o.overdue}
              tone={o.overdue ? "text-red-600" : ""}
            />
            <Card
              title="Avg first response"
              value={formatDuration(o.avgFirstResponseMs)}
            />
            <Card
              title="Avg resolution"
              value={formatDuration(o.avgResolutionMs)}
            />
            <Card
              title="SLA compliance (resolution)"
              value={pct(data.sla.overall.resolution.complianceRate)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Chart title="Tickets created">
              <LineChart data={data.tickets.created}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Tickets"
                  stroke="#4f46e5"
                  strokeWidth={2}
                />
              </LineChart>
            </Chart>

            <Chart title="By status">
              <BarChart
                data={data.tickets.byStatus.map((s) => ({
                  name: label(s.key),
                  count: s.count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} interval={0} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" name="Tickets" fill="#4f46e5" />
              </BarChart>
            </Chart>

            <Chart title="By priority">
              <BarChart
                data={data.tickets.byPriority.map((p) => ({
                  name: label(p.key),
                  count: p.count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" name="Tickets" fill="#f59e0b" />
              </BarChart>
            </Chart>

            <Chart title="Agent workload">
              <BarChart data={data.agents}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" name="Assigned" fill="#4f46e5" />
                <Bar dataKey="active" name="Active" fill="#f59e0b" />
                <Bar dataKey="resolved" name="Resolved" fill="#16a34a" />
              </BarChart>
            </Chart>
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <h3 className="text-sm font-semibold p-4 border-b">
              SLA compliance by priority
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Tickets</th>
                  <th className="p-3">First response met</th>
                  <th className="p-3">Resolution met</th>
                  <th className="p-3">Breach rate</th>
                </tr>
              </thead>
              <tbody>
                {data.sla.byPriority.map((p) => (
                  <tr key={p.priority} className="border-t">
                    <td className="p-3">{label(p.priority)}</td>
                    <td className="p-3">{p.total}</td>
                    <td className="p-3">
                      {pct(p.firstResponse.complianceRate)}
                    </td>
                    <td className="p-3">{pct(p.resolution.complianceRate)}</td>
                    <td className="p-3">{pct(p.resolution.breachRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <h3 className="text-sm font-semibold p-4 border-b">Agents</h3>
            {data.agents.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                No tickets have been assigned in this range.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="p-3">Agent</th>
                    <th className="p-3">Assigned</th>
                    <th className="p-3">Active</th>
                    <th className="p-3">Resolved</th>
                    <th className="p-3">Avg first response</th>
                    <th className="p-3">Avg resolution</th>
                    <th className="p-3">SLA breaches</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agents.map((a) => (
                    <tr key={a.agentId} className="border-t">
                      <td className="p-3">{a.name}</td>
                      <td className="p-3">{a.assigned}</td>
                      <td className="p-3">{a.active}</td>
                      <td className="p-3">{a.resolved}</td>
                      <td className="p-3">
                        {formatDuration(a.avgFirstResponseMs)}
                      </td>
                      <td className="p-3">
                        {formatDuration(a.avgResolutionMs)}
                      </td>
                      <td className="p-3">{a.slaBreaches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

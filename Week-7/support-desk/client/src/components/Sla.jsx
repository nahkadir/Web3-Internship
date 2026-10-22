import { formatDuration } from "../utils/formatDuration";

const styles = {
  BREACHED: "bg-red-100 text-red-700",
  AT_RISK: "bg-amber-100 text-amber-700",
  ON_TRACK: "bg-green-100 text-green-700",
  MET: "bg-gray-100 text-gray-600",
  "N/A": "bg-gray-100 text-gray-400",
};

export function SlaBadge({ sla }) {
  if (!sla || sla.status === "N/A")
    return <span className="text-xs text-gray-400">-</span>;

  const pending = [sla.firstResponse, sla.resolution]
    .filter((t) => t.remainingMs != null)
    .sort((a, b) => a.remainingMs - b.remainingMs)[0];

  let text = "Met";
  if (sla.overdue) text = `Overdue ${formatDuration(pending?.remainingMs)}`;
  else if (sla.status === "BREACHED") text = "Breached";
  else if (pending) text = `Due in ${formatDuration(pending.remainingMs)}`;

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${styles[sla.status]}`}
    >
      {text}
    </span>
  );
}

const Row = ({ title, t }) => (
  <div className="flex items-start justify-between gap-2">
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-xs text-gray-500">
        {t.dueAt ? `Due ${new Date(t.dueAt).toLocaleString()}` : "No deadline"}
        {t.doneAt && ` · done ${new Date(t.doneAt).toLocaleString()}`}
      </p>
    </div>
    <span
      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${styles[t.state]}`}
    >
      {t.remainingMs != null
        ? t.remainingMs < 0
          ? `Overdue ${formatDuration(t.remainingMs)}`
          : `${formatDuration(t.remainingMs)} left`
        : t.state === "MET"
          ? "Met"
          : t.state === "BREACHED"
            ? "Missed"
            : "N/A"}
    </span>
  </div>
);

export function SlaPanel({ sla }) {
  if (!sla) return null;
  return (
    <div className="bg-white p-6 rounded-xl shadow text-sm space-y-3">
      <h3 className="font-semibold">SLA</h3>
      <Row title="First response" t={sla.firstResponse} />
      <Row title="Resolution" t={sla.resolution} />
    </div>
  );
}

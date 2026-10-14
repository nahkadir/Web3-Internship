import { label } from "../constants/ticket";

const statusStyles = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  WAITING_FOR_CUSTOMER: "bg-orange-100 text-orange-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-200 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const priorityStyles = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-50 text-blue-600",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const base = "text-xs px-2 py-1 rounded-full whitespace-nowrap";

export const StatusBadge = ({ status }) => (
  <span className={`${base} ${statusStyles[status]}`}>{label(status)}</span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`${base} ${priorityStyles[priority]}`}>
    {label(priority)}
  </span>
);

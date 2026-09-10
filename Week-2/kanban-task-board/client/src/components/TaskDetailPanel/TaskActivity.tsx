import { useState, useEffect } from "react";
import { getActivity, type ActivityEntry } from "../../api/activity";
import { useAuth } from "../../context/AuthContext";

interface TaskActivityProps {
  taskId: string;
}

const activityLabels: Record<string, string> = {
  created: "created this task",
  assigned: "changed the assignee",
  status_changed: "changed the status",
  priority_changed: "changed the priority",
  due_date_changed: "changed the due date",
  updated: "updated this task",
  comment_added: "added a comment",
  deleted: "deleted this task",
};

const formatActivity = (entry: ActivityEntry) => {
  const label = activityLabels[entry.action] || entry.action;
  if (entry.previousValue && entry.newValue) {
    return `${label}: ${entry.previousValue} → ${entry.newValue}`;
  }
  return label;
};

const TaskActivity = ({ taskId }: TaskActivityProps) => {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchActivity = async () => {
      if (!token) return;
      try {
        const data = await getActivity(taskId, token);
        setActivity(data);
      } catch (err) {
        // Non-critical
      }
    };
    fetchActivity();
  }, [taskId, token]);

  return (
    <div className="flex flex-col gap-3">
      {activity.length === 0 ? (
        <p className="text-white text-small">No activity yet</p>
      ) : (
        activity.map((entry) => (
          <div key={entry._id} className="flex flex-col gap-0.5">
            <p className="text-text-muted text-small">
              <span className="text-white font-medium">{entry.user.name}</span>{" "}
              {formatActivity(entry)}
            </p>
            <span className="text-text-muted text-small opacity-60">
              {new Date(entry.createdAt).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

export default TaskActivity;

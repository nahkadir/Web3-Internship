import Activity from "../models/Activity.js";
import Task from "../models/Task.js";

const hasTaskAccess = (task, userId) => {
  const isOwner = task.owner.toString() === userId.toString();
  const isAssignee =
    task.assignedUser && task.assignedUser.toString() === userId.toString();
  return isOwner || isAssignee;
};

export const getActivity = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (!hasTaskAccess(task, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this task" });
    }

    const activity = await Activity.find({ task: req.params.id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(activity);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// called from inside other controllers whenever something activity-worthy happens
export const logActivity = async ({
  task,
  user,
  action,
  previousValue = null,
  newValue = null,
}) => {
  try {
    await Activity.create({ task, user, action, previousValue, newValue });
  } catch (err) {
    console.error("Failed to log activity:", err.message);
  }
};

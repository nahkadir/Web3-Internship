import Task from "../models/Task.js";
import { logActivity } from "./activityController.js";
import { createNotification } from "./notificationController.js";
import User from "../models/User.js";

export const getTasks = async (req, res) => {
  try {
    const { priority, assignedTo, status, search, dueFrom, dueTo } = req.query;

    if (dueFrom && isNaN(Date.parse(dueFrom))) {
      return res.status(400).json({ message: "Invalid dueFrom date" });
    }
    if (dueTo && isNaN(Date.parse(dueTo))) {
      return res.status(400).json({ message: "Invalid dueTo date" });
    }

    const filter = {
      $or: [{ owner: req.user._id }, { assignedUser: req.user._id }],
    };

    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedUser = assignedTo;
    if (status) filter.status = status;

    if (dueFrom || dueTo) {
      filter.dueDate = {};
      if (dueFrom) filter.dueDate.$gte = new Date(dueFrom);
      if (dueTo) filter.dueDate.$lte = new Date(dueTo);
    }

    if (search) {
      filter.$and = [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const tasks = await Task.find(filter);
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// creates a new task, automatically owned by the logged-in user
export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedUser } =
      req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      assignedUser,
      owner: req.user._id,
    });

    await logActivity({
      task: task._id,
      user: req.user._id,
      action: "created",
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// returns one specific task by its id, only if the logged-in user owns it
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this task" });
    }

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// edits an existing task's fields, only if the logged-in user owns it
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isOwner = task.owner.toString() === req.user._id.toString();
    const isAssignee =
      task.assignedUser &&
      task.assignedUser.toString() === req.user._id.toString();

    if (!isOwner && !isAssignee) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this task" });
    }

    const { title, description, status, priority, dueDate, assignedUser } =
      req.body;

    if (title !== undefined && title !== task.title) {
      task.title = title;
    }

    if (description !== undefined && description !== task.description) {
      task.description = description;
    }

    if (status !== undefined && status !== task.status) {
      await logActivity({
        task: task._id,
        user: req.user._id,
        action: "status_changed",
        previousValue: task.status,
        newValue: status,
      });

      const notifyRecipient =
        task.assignedUser &&
        task.assignedUser.toString() !== req.user._id.toString()
          ? task.assignedUser.toString()
          : task.owner.toString() !== req.user._id.toString()
            ? task.owner.toString()
            : null;

      if (notifyRecipient) {
        await createNotification({
          recipient: notifyRecipient,
          type: "status_changed",
          task: task._id,
          message: `${req.user.name} changed "${task.title}" to ${status}`,
        });
      }

      task.status = status;
    }

    if (priority !== undefined && priority !== task.priority) {
      await logActivity({
        task: task._id,
        user: req.user._id,
        action: "priority_changed",
        previousValue: task.priority,
        newValue: priority,
      });
      task.priority = priority;
    }

    if (
      dueDate !== undefined &&
      dueDate !==
        (task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null)
    ) {
      await logActivity({
        task: task._id,
        user: req.user._id,
        action: "due_date_changed",
        previousValue: task.dueDate
          ? task.dueDate.toISOString().slice(0, 10)
          : "None",
        newValue: dueDate || "None",
      });
      task.dueDate = dueDate;
    }

    if (
      assignedUser !== undefined &&
      assignedUser !== (task.assignedUser ? task.assignedUser.toString() : null)
    ) {
      const previousUser = task.assignedUser
        ? await User.findById(task.assignedUser)
        : null;
      const newUser = assignedUser ? await User.findById(assignedUser) : null;

      await logActivity({
        task: task._id,
        user: req.user._id,
        action: "assigned",
        previousValue: previousUser ? previousUser.name : "Unassigned",
        newValue: newUser ? newUser.name : "Unassigned",
      });

      if (assignedUser && assignedUser !== req.user._id.toString()) {
        await createNotification({
          recipient: assignedUser,
          type: "assigned",
          task: task._id,
          message: `${req.user.name} assigned you a task: "${task.title}"`,
        });
      }

      task.assignedUser = assignedUser;
    }

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// removes a task permanently, only if the logged-in user owns it
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this task" });
    }

    await logActivity({
      task: task._id,
      user: req.user._id,
      action: "deleted",
    });

    await task.deleteOne();
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

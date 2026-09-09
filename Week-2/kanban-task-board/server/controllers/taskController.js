import Task from "../models/Task.js";

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

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedUser !== undefined) task.assignedUser = assignedUser;

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

    await task.deleteOne();
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

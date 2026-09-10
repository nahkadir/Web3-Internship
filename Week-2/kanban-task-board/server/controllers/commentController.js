import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import { logActivity } from "./activityController.js";
import { createNotification } from "./notificationController.js";

const hasTaskAccess = (task, userId) => {
  const isOwner = task.owner.toString() === userId.toString();
  const isAssignee =
    task.assignedUser && task.assignedUser.toString() === userId.toString();
  return isOwner || isAssignee;
};

export const getComments = async (req, res) => {
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

    const comments = await Comment.find({ task: req.params.id })
      .populate("author", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const createComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (!hasTaskAccess(task, req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to comment on this task" });
    }

    const comment = await Comment.create({
      task: req.params.id,
      author: req.user._id,
      content,
    });

    await logActivity({
      task: req.params.id,
      user: req.user._id,
      action: "comment_added",
    });

    const notifyRecipients = [
      task.owner.toString(),
      task.assignedUser?.toString(),
    ].filter((id) => id && id !== req.user._id.toString());

    for (const recipientId of notifyRecipients) {
      await createNotification({
        recipient: recipientId,
        type: "comment_added",
        task: task._id,
        message: `${req.user.name} commented on "${task.title}"`,
      });
    }

    const populated = await comment.populate("author", "name email");

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own comments" });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    comment.content = content;
    const updated = await comment.save();
    const populated = await updated.populate("author", "name email");

    res.status(200).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }

    await comment.deleteOne();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

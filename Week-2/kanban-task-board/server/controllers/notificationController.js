import Notification from "../models/Notification.js";

// three real route handlers (getNotifications, markAsRead, markAllAsRead)
// one plain helper (createNotification) meant to be called from other controllers & not wired to a route itself.

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("task", "title")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true },
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const createNotification = async ({
  recipient,
  type,
  task,
  message,
}) => {
  try {
    await Notification.create({ recipient, type, task, message });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};

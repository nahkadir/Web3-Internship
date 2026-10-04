import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipient,
  actor,
  type,
  post = null,
  comment = null,
}) => {
  // "Do not create a notification when you act on yourself" — enforced once, here,
  // so every trigger site below gets this for free instead of re-checking it each time.
  if (recipient.toString() === actor.toString()) return null;

  return Notification.create({ recipient, actor, type, post, comment });
};

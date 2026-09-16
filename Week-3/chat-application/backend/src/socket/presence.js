// Maps userId to Set of active socket IDs for that user
const onlineUsers = new Map();

export const addUserSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socketId);

  // true if this was the user's FIRST active connection
  return onlineUsers.get(userId).size === 1;
};

export const removeUserSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) return false;

  onlineUsers.get(userId).delete(socketId);

  const isNowOffline = onlineUsers.get(userId).size === 0;
  if (isNowOffline) {
    onlineUsers.delete(userId);
  }

  return isNowOffline;
};

export const isUserOnline = (userId) => onlineUsers.has(userId);

export const getOnlineUserIds = () => Array.from(onlineUsers.keys());

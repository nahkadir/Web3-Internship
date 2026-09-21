import type { ConversationListItem } from "../types";

type Props = {
  conversations: ConversationListItem[];
  activeConversationId?: string;
  onSelectConversation: (conversation: ConversationListItem) => void;
  onNewChat: () => void;
  currentUserId?: string;
  onlineUserIds: Set<string>;
};

const getOtherMember = (c: ConversationListItem, currentUserId?: string) =>
  c.members.find((m) => m && m._id !== currentUserId) ?? null;

const getDisplayName = (c: ConversationListItem, currentUserId?: string) => {
  if (c.type === "group") return c.name ?? "Group";
  return getOtherMember(c, currentUserId)?.name ?? "Unknown";
};

const isOnline = (
  c: ConversationListItem,
  currentUserId: string | undefined,
  onlineUserIds: Set<string>,
) => {
  if (c.type === "group") return false;
  const other = getOtherMember(c, currentUserId);
  return other ? onlineUserIds.has(other._id) : false;
};

const formatTime = (iso?: string) => {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const Sidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  currentUserId,
  onlineUserIds,
}: Props) => (
  <div className="w-64 flex flex-col p-4 gap-2">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-h2">Chats</h2>
      <button
        onClick={onNewChat}
        className="text-tiny px-2 py-1 rounded-card bg-primary text-white hover:opacity-90"
      >
        + New
      </button>
    </div>
    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2">
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelectConversation(c)}
          className={`w-full text-left px-3 py-2 rounded-card text-body cursor-pointer transition-colors ${
            activeConversationId === c.id
              ? "bg-primary-tint"
              : "hover:bg-surface-muted"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 truncate">
              {c.type === "private" && (
                <span
                  className={`w-2 h-2 rounded-pill shrink-0 ${
                    isOnline(c, currentUserId, onlineUserIds)
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                />
              )}
              <span className="font-medium truncate">
                {getDisplayName(c, currentUserId)}
              </span>
            </span>
            {c.lastMessage && (
              <span className="text-tiny text-text-secondary shrink-0">
                {formatTime(c.lastMessage.createdAt ?? c.updatedAt)}
              </span>
            )}
            {c.unreadCount > 0 && (
              <span className="text-tiny bg-primary text-white rounded-pill flex items-center justify-center w-5 h-5 shrink-0">
                {c.unreadCount}
              </span>
            )}
          </div>
          {c.lastMessage && (
            <p className="text-tiny text-text-secondary truncate mt-0.5">
              {c.lastMessage.content}
            </p>
          )}
        </button>
      ))}
    </div>
  </div>
);

export default Sidebar;

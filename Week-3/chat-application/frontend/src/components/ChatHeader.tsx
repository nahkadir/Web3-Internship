import type { ConversationListItem } from "../types";
import ConnectionStatus from "../ConnectionStatus";

type Props = {
  activeConversation: ConversationListItem | null;
  currentUserId?: string;
  onlineUserIds: Set<string>;
};

const ChatHeader = ({
  activeConversation,
  currentUserId,
  onlineUserIds,
}: Props) => {
  if (!activeConversation) return null;

  const isGroup = activeConversation.type === "group";
  const otherMember = !isGroup
    ? activeConversation.members.find((m) => m && m._id !== currentUserId)
    : null;
  const otherIsOnline = otherMember
    ? onlineUserIds.has(otherMember._id)
    : false;

  return (
    <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
      <div>
        <h1 className="text-h1 font-semibold">
          {isGroup ? activeConversation.name : (otherMember?.name ?? "Unknown")}
        </h1>
        <p className="text-tiny text-text-secondary">
          {isGroup ? (
            `${activeConversation.members.filter((m) => m && onlineUserIds.has(m._id)).length} members online`
          ) : (
            <span className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-pill ${
                  otherIsOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              {otherIsOnline ? "Online" : "Offline"}
            </span>
          )}
        </p>
      </div>
      <ConnectionStatus />
    </div>
  );
};

export default ChatHeader;

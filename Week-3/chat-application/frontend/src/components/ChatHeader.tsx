import type { Conversation, ChatUser } from "../types";
import ConnectionStatus from "../ConnectionStatus";

type Props = {
  activeConversation: Conversation | null;
  activeUser: ChatUser | null;
  onlineUserIds: Set<string>;
};

const ChatHeader = ({
  activeConversation,
  activeUser,
  onlineUserIds,
}: Props) => (
  <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
    <div>
      <h1 className="text-h1 font-semibold">
        {activeConversation?.type === "group"
          ? activeConversation.name
          : activeUser?.name}
      </h1>
      <p className="text-tiny text-text-secondary">
        {activeConversation?.type === "group" ? (
          `${activeConversation.members.filter((m) => onlineUserIds.has(m._id)).length} members online`
        ) : (
          <span className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-pill ${
                activeUser && onlineUserIds.has(activeUser.id)
                  ? "bg-green-500"
                  : "bg-gray-400"
              }`}
            />
            {activeUser && onlineUserIds.has(activeUser.id)
              ? "Online"
              : "Offline"}
          </span>
        )}
      </p>
    </div>
    <ConnectionStatus />
  </div>
);

export default ChatHeader;

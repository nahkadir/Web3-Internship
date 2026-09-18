import type { ConversationListItem } from "../types";

type Props = {
  typingUsers: Set<string>;
  activeConversation: ConversationListItem | null;
  currentUserId?: string;
};

const TypingIndicator = ({
  typingUsers,
  activeConversation,
  currentUserId,
}: Props) => {
  if (typingUsers.size === 0 || !activeConversation) return null;

  if (activeConversation.type === "group") {
    return (
      <p className="text-tiny text-text-secondary mb-1">
        {typingUsers.size} {typingUsers.size === 1 ? "person is" : "people are"}{" "}
        typing...
      </p>
    );
  }

  const other = activeConversation.members.find(
    (m) => m && m._id !== currentUserId,
  );
  return (
    <p className="text-tiny text-text-secondary mb-1">
      {other?.name ?? "Someone"} is typing...
    </p>
  );
};

export default TypingIndicator;

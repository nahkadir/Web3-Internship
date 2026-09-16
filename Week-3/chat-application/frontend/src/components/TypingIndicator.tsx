import type { Conversation, ChatUser } from "../types";

type Props = {
  typingUsers: Set<string>;
  activeConversation: Conversation | null;
  activeUser: ChatUser | null;
};

const TypingIndicator = ({
  typingUsers,
  activeConversation,
  activeUser,
}: Props) => {
  if (typingUsers.size === 0) return null;

  return (
    <p className="text-tiny text-text-secondary mb-1">
      {activeConversation?.type === "group"
        ? `${typingUsers.size} ${typingUsers.size === 1 ? "person is" : "people are"} typing...`
        : `${activeUser?.name} is typing...`}
    </p>
  );
};

export default TypingIndicator;

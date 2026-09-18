import { useEffect, useRef } from "react";
import type { Message, ConversationListItem } from "../types";

type Props = {
  messages: Message[];
  currentUserId?: string;
  activeConversation: ConversationListItem | null;
};

const getSenderId = (senderId: Message["senderId"]) =>
  senderId && typeof senderId === "object" ? senderId._id : senderId;

const MessageList = ({
  messages,
  currentUserId,
  activeConversation,
}: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isGroup = activeConversation?.type === "group";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getSenderName = (senderId: Message["senderId"]) => {
    if (senderId && typeof senderId === "object") return senderId.name;
    const member = activeConversation?.members.find(
      (m) => m && m._id === senderId,
    );
    return member?.name ?? "Unknown";
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      {messages.map((m) => {
        const isMine = getSenderId(m.senderId) === currentUserId;

        return (
          <div key={m.id} className={`max-w-xs ${isMine ? "ml-auto" : ""}`}>
            <div
              className={`px-4 py-2 rounded-card text-body ${
                isMine
                  ? "bg-primary text-white"
                  : "bg-primary-tint text-text-primary"
              }`}
            >
              {!isMine && isGroup && (
                <span className="text-tiny font-medium block mb-1 opacity-80">
                  {getSenderName(m.senderId)}
                </span>
              )}
              <p>{m.content}</p>
              <span className="text-tiny text-right opacity-70 block mt-1">
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;

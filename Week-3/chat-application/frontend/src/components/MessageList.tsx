import { useEffect, useRef } from "react";
import type { Message, ChatUser } from "../types";

type Props = {
  messages: Message[];
  currentUserId?: string;
  activeUser: ChatUser | null;
};

const getSenderId = (senderId: Message["senderId"]) =>
  typeof senderId === "string" ? senderId : senderId._id;

const MessageList = ({ messages, currentUserId, activeUser }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto space-y-2">
      {messages.map((m) => {
        const isMine = getSenderId(m.senderId) === currentUserId;
        const senderName =
          typeof m.senderId === "object" ? m.senderId.name : activeUser?.name;

        return (
          <div key={m.id} className={`max-w-xs ${isMine ? "ml-auto" : ""}`}>
            <div
              className={`px-4 py-2 rounded-card text-body ${
                isMine
                  ? "bg-primary text-white"
                  : "bg-primary-tint text-text-primary"
              }`}
            >
              {!isMine && (
                <span className="text-tiny font-medium block mb-1 opacity-80">
                  {senderName}
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

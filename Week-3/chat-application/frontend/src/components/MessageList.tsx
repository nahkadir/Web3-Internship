import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck } from "lucide-react";
import type { Message, ConversationListItem } from "../types";
import MessageActions from "./MessageActions";
import { useSocket } from "../context/SocketContext";

type Props = {
  messages: Message[];
  currentUserId?: string;
  activeConversation: ConversationListItem | null;
  onLoadOlder: () => void;
  hasMore: boolean;
  loadingMore: boolean;
};

const getSenderId = (senderId: Message["senderId"]) =>
  senderId && typeof senderId === "object" ? senderId._id : senderId;

const MessageList = ({
  messages,
  currentUserId,
  activeConversation,
  onLoadOlder,
  hasMore,
  loadingMore,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);
  const isGroup = activeConversation?.type === "group";
  const { socket } = useSocket();

  const [localMessages, setLocalMessages] = useState(messages);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => setLocalMessages(messages), [messages]);

  useEffect(() => {
    if (!socket) return;

    const onEdited = ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      setLocalMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content, edited: true } : m,
        ),
      );
    };

    const onDeleted = ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      setLocalMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content, deleted: true } : m,
        ),
      );
    };

    socket.on("message_edited", onEdited);
    socket.on("message_deleted", onDeleted);
    return () => {
      socket.off("message_edited", onEdited);
      socket.off("message_deleted", onDeleted);
    };
  }, [socket]);

  // restore scroll position after older messages are prepended
  useEffect(() => {
    const el = containerRef.current;
    if (!el || prevScrollHeight.current === 0) return;
    el.scrollTop = el.scrollHeight - prevScrollHeight.current;
    prevScrollHeight.current = 0;
  }, [localMessages]);

  // only auto-scroll to bottom for new messages, not when older ones load in
  useEffect(() => {
    if (prevScrollHeight.current === 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMessages]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop < 50) {
      prevScrollHeight.current = el.scrollHeight;
      onLoadOlder();
    }
  };

  const getSenderName = (senderId: Message["senderId"]) => {
    if (senderId && typeof senderId === "object") return senderId.name;
    const member = activeConversation?.members.find(
      (m) => m && m._id === senderId,
    );
    return member?.name ?? "Unknown";
  };

  const getTickStatus = (m: Message): "sent" | "delivered" | "read" => {
    if (!activeConversation || activeConversation.type !== "private")
      return "sent";
    const other = activeConversation.members.find(
      (mem) => mem && mem._id !== currentUserId,
    );
    if (!other) return "sent";
    if (m.readBy?.includes(other._id)) return "read";
    if (m.deliveredTo?.includes(other._id)) return "delivered";
    return "sent";
  };

  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setEditValue(m.content);
  };

  const submitEdit = (messageId: string) => {
    if (editValue.trim()) {
      socket.emit("edit_message", { messageId, content: editValue.trim() });
    }
    setEditingId(null);
  };

  const handleDelete = (messageId: string) => {
    socket.emit("delete_message", { messageId });
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto min-h-0 space-y-2"
    >
      {loadingMore && (
        <p className="text-tiny text-center text-text-secondary">
          Loading older messages...
        </p>
      )}
      {localMessages.map((m) => {
        const isMine = getSenderId(m.senderId) === currentUserId;
        const isDeleted = (m as any).deleted;
        const isEditing = editingId === m.id;

        return (
          <div
            key={m.id}
            className={`group max-w-xs ${isMine ? "ml-auto" : ""}`}
          >
            <div
              className={`px-4 py-2 rounded-card text-body relative ${
                isMine
                  ? "bg-primary text-white"
                  : "bg-primary-tint text-text-primary"
              }`}
            >
              {isMine && !isDeleted && (
                <div className="absolute -top-1 right-1">
                  <MessageActions
                    onEdit={() => startEdit(m)}
                    onDelete={() => handleDelete(m.id)}
                  />
                </div>
              )}

              {!isMine && isGroup && (
                <span className="text-tiny font-medium block mb-1 opacity-80">
                  {getSenderName(m.senderId)}
                </span>
              )}

              {isEditing ? (
                <div className="flex gap-1">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitEdit(m.id)}
                    autoFocus
                    className="flex-1 bg-white/20 rounded px-2 py-1 text-body outline-none"
                  />
                  <button
                    onClick={() => submitEdit(m.id)}
                    className="text-tiny"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-tiny"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className={isDeleted ? "italic opacity-60" : ""}>
                  {m.content}
                </p>
              )}

              <span className="text-tiny text-right opacity-70 flex items-center justify-end gap-1 mt-1">
                {(m as any).edited && !isDeleted && (
                  <span className="italic">(edited)</span>
                )}
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {isMine && !isDeleted && (
                  <span
                    className={
                      getTickStatus(m) === "read" ? "text-blue-300" : ""
                    }
                  >
                    {getTickStatus(m) === "sent" ? (
                      <Check size={14} />
                    ) : (
                      <CheckCheck size={14} />
                    )}
                  </span>
                )}
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

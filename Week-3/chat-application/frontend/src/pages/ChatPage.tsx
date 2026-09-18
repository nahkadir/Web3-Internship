import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LogOut, MessageSquare, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getConversations, getMessages } from "../lib/api";
import type { Message, ConversationListItem } from "../types";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import TypingIndicator from "../components/TypingIndicator";
import MessageInput from "../components/MessageInput";
import NewChatModal from "../components/NewChatModal";

const ChatPage = () => {
  const { user, logout } = useAuth();
  const { socket, onlineUserIds } = useSocket();

  console.log("current user:", user);
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [activeConversation, setActiveConversation] =
    useState<ConversationListItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showNewChat, setShowNewChat] = useState(false);

  const handleConversationCreated = async (conversationId: string) => {
    const data = await getConversations();
    setConversations(data.conversations);

    const created = data.conversations.find(
      (c: ConversationListItem) => c.id === conversationId,
    );
    if (created) {
      setShowNewChat(false);
      openConversation(created);
    }
  };

  useEffect(() => {
    getConversations().then((data) => setConversations(data.conversations));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg: Message) => {
      if (msg.conversationId === activeConversation?.id) {
        setMessages((prev) => [...prev, msg]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: { content: msg.content, createdAt: msg.createdAt },
                unreadCount:
                  c.id === activeConversation?.id ? 0 : c.unreadCount + 1,
              }
            : c,
        ),
      );
    };

    socket.on("receive_message", onReceive);
    return () => {
      socket.off("receive_message", onReceive);
    };
  }, [socket, activeConversation?.id]);

  useEffect(() => {
    if (!socket) return;

    const onTypingStart = ({
      userId,
      conversationId: cid,
    }: {
      userId: string;
      conversationId: string;
    }) => {
      if (cid !== activeConversation?.id) return;
      setTypingUsers((prev) => new Set(prev).add(userId));
    };

    const onTypingStop = ({
      userId,
      conversationId: cid,
    }: {
      userId: string;
      conversationId: string;
    }) => {
      if (cid !== activeConversation?.id) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on("typing_start", onTypingStart);
    socket.on("typing_stop", onTypingStop);
    return () => {
      socket.off("typing_start", onTypingStart);
      socket.off("typing_stop", onTypingStop);
    };
  }, [socket, activeConversation?.id]);

  useEffect(() => {
    if (!socket) return;

    const onDelivered = ({
      messageId,
      deliveredTo,
    }: {
      messageId: string;
      deliveredTo: string[];
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                deliveredTo: [
                  ...new Set([...(m.deliveredTo ?? []), ...deliveredTo]),
                ],
              }
            : m,
        ),
      );
    };

    const onRead = (data: {
      messageId?: string;
      readBy?: string[];
      messageIds?: string[];
      readerId?: string;
    }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (data.messageIds && data.messageIds.includes(m.id)) {
            return {
              ...m,
              readBy: [...new Set([...(m.readBy ?? []), data.readerId!])],
            };
          }
          if (data.messageId === m.id && data.readBy) {
            return {
              ...m,
              readBy: [...new Set([...(m.readBy ?? []), ...data.readBy])],
            };
          }
          return m;
        }),
      );
    };

    socket.on("message_delivered", onDelivered);
    socket.on("message_read", onRead);
    return () => {
      socket.off("message_delivered", onDelivered);
      socket.off("message_read", onRead);
    };
  }, [socket]);

  const openConversation = async (conversation: ConversationListItem) => {
    if (activeConversation) {
      socket.emit("leave_conversation", {
        conversationId: activeConversation.id,
      });
    }

    const { messages: history } = await getMessages(conversation.id);

    setActiveConversation(conversation);
    setMessages(
      history.map((m: any) => ({
        id: m._id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt,
        deliveredTo: m.deliveredTo ?? [],
        readBy: m.readBy ?? [],
      })),
    );

    socket.emit("join_conversation", { conversationId: conversation.id });
    socket.emit("mark_messages_read", { conversationId: conversation.id });
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c,
      ),
    );
  };

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeConversation) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing_stop", { conversationId: activeConversation.id });

    if (!input.trim()) return;

    socket.emit("send_message", {
      conversationId: activeConversation.id,
      content: input,
    });
    setInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!activeConversation) return;

    socket.emit("typing_start", { conversationId: activeConversation.id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { conversationId: activeConversation.id });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-bg-ambient p-3 flex">
      <div className="w-20 flex flex-col items-center py-4 gap-2">
        <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-card text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors">
          <MessageSquare size={22} fill="currentColor" />
          <span className="text-tiny">Chats</span>
        </button>
        <div className="flex-1" />
        <Link
          to="/profile"
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-card text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
        >
          <User size={22} fill="currentColor" />
          <span className="text-tiny">Profile</span>
        </Link>
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-card text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
        >
          <LogOut size={22} fill="currentColor" />
          <span className="text-tiny">Log out</span>
        </button>
      </div>

      <div className="bg-surface rounded-panel flex-1 flex overflow-hidden">
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversation?.id}
          onSelectConversation={openConversation}
          onNewChat={() => setShowNewChat(true)}
          currentUserId={user?.id}
          onlineUserIds={onlineUserIds}
        />

        {showNewChat && (
          <NewChatModal
            onClose={() => setShowNewChat(false)}
            onCreated={handleConversationCreated}
          />
        )}

        <div className="bg-surface rounded-panel flex-1 flex flex-col p-4">
          {activeConversation ? (
            <>
              <ChatHeader
                activeConversation={activeConversation}
                currentUserId={user?.id}
                onlineUserIds={onlineUserIds}
              />
              <MessageList
                messages={messages}
                currentUserId={user?.id}
                activeConversation={activeConversation}
              />
              <TypingIndicator
                typingUsers={typingUsers}
                activeConversation={activeConversation}
                currentUserId={user?.id}
              />
              <MessageInput
                value={input}
                onChange={handleInputChange}
                onSubmit={handleSend}
              />
            </>
          ) : (
            <p className="text-text-secondary m-auto">
              Select a conversation to start chatting
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

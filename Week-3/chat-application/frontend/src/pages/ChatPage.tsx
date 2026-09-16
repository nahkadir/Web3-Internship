import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LogOut, MessageSquare, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getUsers, getOrCreateConversation, getMessages } from "../lib/api";
import type { ChatUser, Message, Conversation } from "../types";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import TypingIndicator from "../components/TypingIndicator";
import MessageInput from "../components/MessageInput";

const ChatPage = () => {
  const { user, logout } = useAuth();
  const { socket, onlineUserIds } = useSocket();

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getUsers().then((data) =>
      setUsers(
        data.users.map((u: any) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
        })),
      ),
    );
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg: Message) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive_message", onReceive);
    return () => {
      socket.off("receive_message", onReceive);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    if (!socket) return;

    const onTypingStart = ({
      userId,
      conversationId: cid,
    }: {
      userId: string;
      conversationId: string;
    }) => {
      if (cid !== conversationId) return;
      setTypingUsers((prev) => new Set(prev).add(userId));
    };

    const onTypingStop = ({
      userId,
      conversationId: cid,
    }: {
      userId: string;
      conversationId: string;
    }) => {
      if (cid !== conversationId) return;
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
  }, [socket, conversationId]);

  const openConversation = async (targetUser: ChatUser) => {
    if (conversationId) {
      socket.emit("leave_conversation", { conversationId });
    }

    const { conversation } = await getOrCreateConversation(targetUser.id);
    const { messages: history } = await getMessages(conversation._id);

    setActiveUser(targetUser);
    setConversationId(conversation._id);
    setActiveConversation({
      id: conversation._id,
      type: conversation.type,
      name: conversation.name,
      members: conversation.members ?? [
        { _id: targetUser.id, name: targetUser.name },
      ],
    });
    setMessages(
      history.map((m: any) => ({
        id: m._id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt,
      })),
    );

    socket.emit("join_conversation", { conversationId: conversation._id });
  };

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing_stop", { conversationId });

    if (!input.trim() || !conversationId) return;

    socket.emit("send_message", { conversationId, content: input });
    setInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!conversationId) return;

    socket.emit("typing_start", { conversationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { conversationId });
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
          users={users}
          activeUserId={activeUser?.id}
          onSelectUser={openConversation}
          onlineUserIds={onlineUserIds}
        />

        <div className="bg-surface rounded-panel flex-1 flex flex-col p-4">
          {activeUser ? (
            <>
              <ChatHeader
                activeConversation={activeConversation}
                activeUser={activeUser}
                onlineUserIds={onlineUserIds}
              />
              <MessageList
                messages={messages}
                currentUserId={user?.id}
                activeUser={activeUser}
              />
              <TypingIndicator
                typingUsers={typingUsers}
                activeConversation={activeConversation}
                activeUser={activeUser}
              />
              <MessageInput
                value={input}
                onChange={handleInputChange}
                onSubmit={handleSend}
              />
            </>
          ) : (
            <p className="text-text-secondary m-auto">
              Select a user to start chatting
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

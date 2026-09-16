import { useState, useEffect, useRef, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { LogOut, MessageSquare, User, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getUsers, getOrCreateConversation, getMessages } from "../lib/api";
import ConnectionStatus from "../ConnectionStatus";

type ChatUser = { id: string; name: string; email: string; avatar?: string };
type Message = {
  id: string;
  conversationId: string;
  senderId: string | { _id: string; name: string; avatar?: string };
  content: string;
  createdAt: string;
};

const ChatPage = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (targetUser: ChatUser) => {
    if (conversationId) {
      socket.emit("leave_conversation", { conversationId });
    }

    const { conversation } = await getOrCreateConversation(targetUser.id);
    const { messages: history } = await getMessages(conversation._id);

    setActiveUser(targetUser);
    setConversationId(conversation._id);
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

  const handleSend = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) return;

    socket.emit("send_message", { conversationId, content: input });
    setInput("");
  };

  const getSenderId = (senderId: Message["senderId"]) =>
    typeof senderId === "string" ? senderId : senderId._id;

  return (
    <div className="min-h-screen bg-bg-ambient p-3 flex">
      {/* Icon rail — no background, just buttons */}
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
        {/* User list */}
        <div className="w-64 flex flex-col p-4 gap-2">
          <h2 className="text-h2 mb-2">Chats</h2>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => openConversation(u)}
              className={`w-full text-left px-3 py-2 rounded-md text-body cursor-pointer transition-colors ${
                activeUser?.id === u.id
                  ? "bg-primary-tint"
                  : "hover:bg-surface-muted"
              }`}
            >
              {u.name}
            </button>
          ))}
        </div>

        {/* Chat panel */}
        <div className="bg-surface rounded-panel flex-1 flex flex-col p-4">
          {activeUser ? (
            <>
              <div className="flex items-center justify-between pb-3 mb-3">
                <h1 className="text-h1">{activeUser.name}</h1>
                <ConnectionStatus />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {messages.map((m) => {
                  const isMine = getSenderId(m.senderId) === user?.id;
                  const senderName =
                    typeof m.senderId === "object"
                      ? m.senderId.name
                      : activeUser?.name;

                  return (
                    <div
                      key={m.id}
                      className={`max-w-xs ${isMine ? "ml-auto" : ""}`}
                    >
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

              <form
                onSubmit={handleSend}
                className="flex gap-2 mt-3 p-1 bg-send-bg rounded-lg"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Your message"
                  className="flex-1 px-4 py-2 text-body outline-none"
                />
                <button
                  type="submit"
                  className="text-primary p-2.5 cursor-pointer hover:bg-primary-tint transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
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

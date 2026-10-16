import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import socket from "../services/socket";
import { useAuth } from "../context/AuthContext";
import { useSocketStatus } from "../context/SocketContext";
import useSocketEvent from "../hooks/useSocketEvent";
import { label } from "../constants/ticket";
import { getErrorMessage } from "../utils/getErrorMessage";

// merge by _id: removes duplicates (API response + socket event), applies edits, keeps order
const mergeMessages = (prev, incoming) => {
  const byId = new Map(prev.map((m) => [m._id, m]));
  incoming.forEach((m) => byId.set(m._id, m));
  return [...byId.values()].sort((a, b) => (a._id < b._id ? -1 : 1));
};

const STATUS_UI = {
  connected: ["Live", "bg-green-100 text-green-700"],
  connecting: ["Connecting...", "bg-amber-100 text-amber-700"],
  disconnected: ["Offline", "bg-gray-200 text-gray-600"],
  error: ["Connection problem", "bg-red-100 text-red-700"],
};

export default function ConversationPanel({ ticketId, closed }) {
  const { user } = useAuth();
  const status = useSocketStatus();

  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [editWindowMs, setEditWindowMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [presence, setPresence] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [editing, setEditing] = useState(null); // { id, text }
  const [editError, setEditError] = useState("");

  const listRef = useRef(null);
  const stickToBottom = useRef(true);

  const fetchLatest = useCallback(
    async (initial = false) => {
      try {
        const res = await api.get(`/tickets/${ticketId}/messages`);
        const {
          messages: latest,
          hasMore: more,
          editWindowMs: windowMs,
        } = res.data.data;
        setMessages((prev) => mergeMessages(prev, latest));
        setEditWindowMs(windowMs);
        if (initial) setHasMore(more);
        setLoadError("");
      } catch (err) {
        setLoadError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [ticketId],
  );

  useEffect(() => {
    fetchLatest(true);
  }, [fetchLatest]);

  // join the live room on every (re)connect; rooms are lost when a socket drops,
  // so each join also re-fetches to catch up on anything missed while offline
  useEffect(() => {
    const join = () => {
      socket.emit("join_ticket", ticketId, (res) => {
        if (!res?.ok) {
          setJoinError(res?.message || "Live updates unavailable");
          return;
        }
        setJoinError("");
        setPresence(res.presence.filter((u) => u._id !== user._id));
        fetchLatest();
      });
    };
    if (socket.connected) join();
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
      if (socket.connected) socket.emit("leave_ticket", ticketId);
    };
  }, [ticketId, user._id, fetchLatest]);

  useSocketEvent("ticket_message", ({ message }) => {
    if (message.ticketId === ticketId)
      setMessages((prev) => mergeMessages(prev, [message]));
  });

  useSocketEvent("user_joined", ({ ticketId: t, user: u }) => {
    if (t !== ticketId || u._id === user._id) return;
    setPresence((prev) =>
      prev.some((p) => p._id === u._id) ? prev : [...prev, u],
    );
  });

  useSocketEvent("user_left", ({ ticketId: t, user: u }) => {
    if (t === ticketId)
      setPresence((prev) => prev.filter((p) => p._id !== u._id));
  });

  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    const el = listRef.current;
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadOlder = async () => {
    if (!messages.length) return;
    setLoadingOlder(true);
    try {
      const res = await api.get(`/tickets/${ticketId}/messages`, {
        params: { before: messages[0]._id },
      });
      stickToBottom.current = false;
      setMessages((prev) => mergeMessages(prev, res.data.data.messages));
      setHasMore(res.data.data.hasMore);
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError("");
    try {
      const res = await api.post(`/tickets/${ticketId}/messages`, {
        message: text,
      });
      stickToBottom.current = true;
      setMessages((prev) => mergeMessages(prev, [res.data.data.message]));
      setDraft("");
    } catch (err) {
      setSendError(getErrorMessage(err)); // draft is kept so the user can retry
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async () => {
    const text = editing.text.trim();
    if (!text) return;
    setEditError("");
    try {
      const res = await api.patch(
        `/tickets/${ticketId}/messages/${editing.id}`,
        { message: text },
      );
      setMessages((prev) => mergeMessages(prev, [res.data.data.message]));
      setEditing(null);
    } catch (err) {
      setEditError(getErrorMessage(err));
    }
  };

  const canEdit = (m) =>
    !closed &&
    m.messageType === "USER" &&
    m.senderId?._id === user._id &&
    Date.now() - new Date(m.createdAt).getTime() < editWindowMs;

  const [statusText, statusStyle] = STATUS_UI[status];

  return (
    <div className="bg-white rounded-xl shadow flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b">
        <h3 className="font-semibold">Conversation</h3>
        <div className="flex items-center gap-2 text-xs">
          {presence.length > 0 && (
            <span className="text-gray-500">
              Here now: {presence.map((p) => p.name).join(", ")}
            </span>
          )}
          <span className={`px-2 py-1 rounded-full ${statusStyle}`}>
            {statusText}
          </span>
        </div>
      </div>

      {joinError && status === "connected" && (
        <p className="text-xs text-amber-700 bg-amber-50 px-4 py-2">
          {joinError}
        </p>
      )}
      {loadError && messages.length > 0 && (
        <p className="text-xs text-red-600 bg-red-50 px-4 py-2">{loadError}</p>
      )}

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-[26rem] overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        {loading && (
          <p className="text-center text-sm text-gray-500">
            Loading messages...
          </p>
        )}

        {!loading && loadError && messages.length === 0 && (
          <div className="text-center text-sm">
            <p className="text-red-600 mb-2">{loadError}</p>
            <button
              onClick={() => {
                setLoading(true);
                fetchLatest(true);
              }}
              className="text-indigo-600"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && messages.length === 0 && (
          <p className="text-center text-sm text-gray-500 mt-10">
            No messages yet. Start the conversation below.
          </p>
        )}

        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="text-xs text-indigo-600 disabled:opacity-50"
            >
              {loadingOlder ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {messages.map((m) => {
          const time = new Date(m.createdAt).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          });

          if (m.messageType === "SYSTEM") {
            return (
              <p key={m._id} className="text-center text-xs text-gray-500">
                {m.senderId?.name}: {m.message} · {time}
              </p>
            );
          }

          const mine = m.senderId?._id === user._id;
          const isEditing = editing?.id === m._id;

          return (
            <div
              key={m._id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${mine ? "bg-indigo-600 text-white" : "bg-white border"}`}
              >
                <p
                  className={`text-xs mb-1 ${mine ? "text-indigo-100" : "text-gray-500"}`}
                >
                  {mine ? "You" : m.senderId?.name}
                  {m.senderId?.role !== "CUSTOMER" &&
                    ` (${label(m.senderId?.role || "AGENT")})`}{" "}
                  · {time}
                  {m.editedAt && " · edited"}
                </p>

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={editing.text}
                      autoFocus
                      onChange={(e) =>
                        setEditing({ ...editing, text: e.target.value })
                      }
                      className="w-full border rounded-lg px-2 py-1 text-gray-900"
                    />
                    {editError && (
                      <p className="text-xs text-red-200">{editError}</p>
                    )}
                    <div className="flex gap-3 text-xs">
                      <button onClick={saveEdit} className="font-semibold">
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(null);
                          setEditError("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                )}

                {canEdit(m) && !isEditing && (
                  <button
                    onClick={() => {
                      setEditing({ id: m._id, text: m.message });
                      setEditError("");
                    }}
                    className="text-xs mt-1 underline opacity-80"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t">
        {closed ? (
          <p className="text-sm text-gray-500 text-center">
            This ticket is closed, so new messages can't be sent.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="space-y-2"
          >
            {sendError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {sendError}
              </p>
            )}
            <textarea
              rows={3}
              value={draft}
              maxLength={2000}
              placeholder="Type your message... (Enter to send, Shift+Enter for a new line)"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{draft.length}/2000</span>
              <button
                disabled={sending || !draft.trim()}
                className="bg-indigo-600 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

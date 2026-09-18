import { useState, useEffect } from "react";
import type { ChatUser } from "../types";
import { getUsers, createConversation } from "../lib/api";

type Props = {
  onClose: () => void;
  onCreated: (conversationId: string) => void;
};

const NewChatModal = ({ onClose, onCreated }: Props) => {
  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUsers().then((data) =>
      setUsers(
        data.users.map((u: any) => ({
          id: u._id,
          name: u.name,
          email: u.email,
        })),
      ),
    );
  }, []);

  const toggleUser = (id: string) => {
    if (mode === "direct") {
      setSelectedIds([id]);
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreate = async () => {
    setError("");

    if (mode === "direct" && selectedIds.length !== 1) {
      setError("Select a user to chat with");
      return;
    }
    if (mode === "group" && (!groupName.trim() || selectedIds.length < 2)) {
      setError("Group needs a name and at least 2 members");
      return;
    }

    setLoading(true);
    try {
      const { conversation } = await createConversation(
        mode === "direct"
          ? { recipientId: selectedIds[0] }
          : { type: "group", name: groupName, memberIds: selectedIds },
      );
      onCreated(conversation._id);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface rounded-panel p-4 w-80 flex flex-col gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setMode("direct");
              setSelectedIds([]);
            }}
            className={`flex-1 py-1.5 rounded-card text-body ${
              mode === "direct" ? "bg-primary text-white" : "bg-surface-muted"
            }`}
          >
            Direct
          </button>
          <button
            onClick={() => {
              setMode("group");
              setSelectedIds([]);
            }}
            className={`flex-1 py-1.5 rounded-card text-body ${
              mode === "group" ? "bg-primary text-white" : "bg-surface-muted"
            }`}
          >
            Group
          </button>
        </div>

        {mode === "group" && (
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="px-3 py-2 rounded-card border border-border text-body outline-none"
          />
        )}

        <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
          {users.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-card hover:bg-surface-muted cursor-pointer"
            >
              <input
                type={mode === "direct" ? "radio" : "checkbox"}
                checked={selectedIds.includes(u.id)}
                onChange={() => toggleUser(u.id)}
              />
              {u.name}
            </label>
          ))}
        </div>

        {error && <p className="text-tiny text-red-500">{error}</p>}

        <div className="flex gap-2 mt-1">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 rounded-card bg-surface-muted text-body"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-1.5 rounded-card bg-primary text-white text-body disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;

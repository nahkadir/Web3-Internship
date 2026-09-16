import type { ChatUser } from "../types";

type Props = {
  users: ChatUser[];
  activeUserId?: string;
  onSelectUser: (user: ChatUser) => void;
  onlineUserIds: Set<string>;
};

const Sidebar = ({
  users,
  activeUserId,
  onSelectUser,
  onlineUserIds,
}: Props) => (
  <div className="w-64 flex flex-col p-4 gap-2">
    <h2 className="text-h2 mb-2">Chats</h2>
    {users.map((u) => (
      <button
        key={u.id}
        onClick={() => onSelectUser(u)}
        className={`w-full text-left px-3 py-2 rounded-card text-body cursor-pointer transition-colors ${
          activeUserId === u.id ? "bg-primary-tint" : "hover:bg-surface-muted"
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-pill ${
              onlineUserIds.has(u.id) ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {u.name}
        </span>
      </button>
    ))}
  </div>
);

export default Sidebar;

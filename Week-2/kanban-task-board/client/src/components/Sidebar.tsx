import type { User } from "../../types.ts";
import NotificationBell from "./NotificationBell";
import { MdOutlineViewKanban } from "react-icons/md";

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar = ({ user, onLogout }: SidebarProps) => {
  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col justify-between py-6 px-4">
      <div>
        <div>
          <div className="flex items-center gap-2 px-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect
                  x="1"
                  y="2"
                  width="3"
                  height="12"
                  rx="1"
                  className="fill-bg"
                />
                <rect
                  x="6.5"
                  y="2"
                  width="3"
                  height="7"
                  rx="1"
                  className="fill-bg"
                />
                <rect
                  x="12"
                  y="2"
                  width="3"
                  height="9"
                  rx="1"
                  className="fill-bg"
                />
              </svg>
            </div>
            <span className="text-white font-medium text-lg">Kanban</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <div>
            <NotificationBell />
          </div>
          <div className="px-3 py-2 rounded-lg bg-card text-white text-sm flex gap-2">
            <MdOutlineViewKanban size={20} /> Dashboard
          </div>
        </nav>
      </div>

      <div className="border-t border-border pt-4 px-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-text text-sm font-medium">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate">
              {user.name}
            </p>
            <p className="text-[#8B8D98] text-xs truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full cursor-pointer text-left px-3 py-2 rounded-lg text-[#8B8D98] text-sm hover:bg-card hover:text-text transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

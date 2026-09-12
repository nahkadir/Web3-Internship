import { useState } from "react";
import type { User } from "../../types.ts";
import NotificationBell from "./NotificationBell";
import { MdOutlineViewKanban, MdMenu, MdClose } from "react-icons/md";
import { IoExitOutline } from "react-icons/io5";

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar = ({ user, onLogout }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-white"
      >
        <MdMenu size={20} />
      </button>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`w-64 h-screen bg-surface border-r border-border flex flex-col justify-between py-6 px-4 fixed md:static top-0 left-0 z-50 transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          <div>
            <div className="flex items-center justify-between px-2 mb-8">
              <div className="flex items-center gap-2">
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

              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden text-white"
              >
                <MdClose size={20} />
              </button>
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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-text text-sm font-medium shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-white text-sm font-medium truncate">
                {user.name}
              </p>
              <p className="text-text text-xs truncate">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              title="Log out"
              className="text-text hover:text-priority-high transition-colors shrink-0 cursor-pointer"
            >
              <IoExitOutline size={20} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

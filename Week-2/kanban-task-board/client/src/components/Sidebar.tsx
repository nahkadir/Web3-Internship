import type { User } from "../../types.ts";

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar = ({ user, onLogout }: SidebarProps) => {
  return (
    <aside className="w-64 h-screen bg-[#151619] border-r border-[#2A2B30] flex flex-col justify-between py-6 px-4">
      <div>
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#A3FF3D] flex items-center justify-center font-bold text-[#0E0F11]">
            K
          </div>
          <span className="text-[#F2F2F3] font-semibold text-lg">Kanban</span>
        </div>

        <nav className="flex flex-col gap-1">
          <div className="px-3 py-2 rounded-lg bg-[#1C1D21] text-[#F2F2F3] text-sm font-medium">
            Board
          </div>
        </nav>
      </div>

      <div className="border-t border-[#2A2B30] pt-4 px-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#2A2B30] flex items-center justify-center text-[#F2F2F3] text-sm font-medium">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-[#F2F2F3] text-sm font-medium truncate">
              {user.name}
            </p>
            <p className="text-[#8B8D98] text-xs truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-[#8B8D98] text-sm hover:bg-[#1C1D21] hover:text-[#F2F2F3] transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

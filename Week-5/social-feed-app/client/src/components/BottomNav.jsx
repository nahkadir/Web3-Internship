import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search as SearchIcon, Bell, User, Feather } from "lucide-react";
import { useNotifications } from "../context/NotificationsContext";

const navItems = [
  { to: "/dashboard", Icon: Home },
  { to: "/search", Icon: SearchIcon },
  { to: "/notifications", Icon: Bell, badge: true },
  { to: "/profile", Icon: User },
];

export default function BottomNav() {
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 z-30 flex w-full items-center justify-around border-t border-hairline bg-bg/95 py-2 backdrop-blur md:hidden">
      {navItems.map(({ to, Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `relative grid h-10 w-10 place-items-center rounded-full ${isActive ? "text-text" : "text-secondary"}`
          }
        >
          <Icon size={24} strokeWidth={2} />
          {badge && unreadCount > 0 && (
            <span className="absolute right-1 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-x-blue px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function ComposeFab() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/dashboard")}
      className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-x-blue text-white shadow-lg hover:bg-x-blue-hover md:hidden"
      aria-label="New post"
    >
      <Feather size={22} />
    </button>
  );
}

import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Search as SearchIcon,
  User,
  Feather,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const navItems = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/search", label: "Search", Icon: SearchIcon },
  { to: "/profile", label: "Profile", Icon: User },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[68px] flex-col justify-between py-2 xl:w-[275px]">
      <div>
        <div className="mb-2 grid h-12 w-12 place-items-center rounded-full text-2xl font-bold hover:bg-hover">
          𝕏
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-full px-3 py-3 transition hover:bg-hover ${
                  isActive ? "font-bold text-text" : "font-normal text-text"
                }`
              }
            >
              <Icon size={26} strokeWidth={2} />
              <span className="hidden xl:inline text-[19px]">{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 grid h-12 w-12 place-items-center rounded-full bg-x-blue text-white hover:bg-x-blue-hover xl:w-[90%] xl:justify-self-start"
        >
          <Feather size={20} className="xl:hidden" />
          <span className="hidden xl:inline font-bold">Post</span>
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-full p-2 text-left hover:bg-hover"
      >
        <Avatar
          src={user?.avatar}
          name={user?.name}
          size="h-10 w-10"
          textSize="text-sm"
        />
        <div className="hidden min-w-0 items-center gap-2 xl:flex">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-text">
              {user?.name}
            </p>
            <p className="truncate text-sm text-secondary">Log out</p>
          </div>
          <LogOut size={16} className="shrink-0 text-secondary" />
        </div>
      </button>
    </aside>
  );
}

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import { House, UserRound } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Home", icon: <House size={26} /> },
  { to: "/profile", label: "Profile", icon: <UserRound size={26} /> },
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
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-full px-3 py-3 text-xl transition hover:bg-hover ${
                  isActive ? "font-bold text-text" : "font-normal text-text"
                }`
              }
            >
              <span>{item.icon}</span>
              <span className="hidden xl:inline text-[19px]">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 grid h-12 w-12 place-items-center rounded-full bg-x-blue text-xl font-bold text-white hover:bg-x-blue-hover xl:w-[90%] xl:justify-self-start"
        >
          <span className="xl:hidden">✎</span>
          <span className="hidden xl:inline">Post</span>
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
        <div className="hidden min-w-0 xl:block">
          <p className="truncate text-[15px] font-bold text-text">
            {user?.name}
          </p>
          <p className="truncate text-sm text-secondary">Log out</p>
        </div>
      </button>
    </aside>
  );
}

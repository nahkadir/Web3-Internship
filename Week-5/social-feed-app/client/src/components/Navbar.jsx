import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout(); // ProtectedRoute redirects to /login once user is null
  };

  const linkClass = ({ isActive }) =>
    `text-sm ${isActive ? "font-medium text-indigo-600" : "text-gray-600 hover:text-gray-900"}`;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="text-lg font-semibold text-indigo-600"
          >
            SocialFeed
          </Link>
          <nav className="flex items-center gap-4">
            <NavLink to="/dashboard" className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </header>
  );
}

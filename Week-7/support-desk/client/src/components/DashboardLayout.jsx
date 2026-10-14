import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const badge = {
  CUSTOMER: "bg-blue-100 text-blue-700",
  AGENT: "bg-green-100 text-green-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.name}</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${badge[user.role]}`}
            >
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

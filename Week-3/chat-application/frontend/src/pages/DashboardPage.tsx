import { useAuth } from "../context/AuthContext";
import { ConnectionStatus } from "../ConnectionStatus";

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-bg-ambient p-8">
      <div className="bg-surface rounded-panel p-6 max-w-2xl mx-auto">
        <ConnectionStatus />
        <h1 className="text-h1 font-semibold">Welcome, {user?.name}</h1>
        <p className="text-body text-text-secondary">{user?.email}</p>
        <button
          onClick={logout}
          className="mt-4 rounded-card bg-primary text-white px-4 py-2 text-body"
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;

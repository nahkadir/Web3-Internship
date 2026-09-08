import Sidebar from "../components/Sidebar";
import KanbanBoard from "../components/KanbanBoard";
import { mockTasks } from "../mockData";
import { useAuth } from "../context/AuthContext";

function BoardPage() {
  const { user, logout } = useAuth();

  // typeguard as user can be User | null
  if (!user) {
    return null;
  }

  return (
    <div className="flex bg-bg min-h-screen">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8">
        <h1 className="text-text text-xl font-semibold mb-6">Board</h1>
        <KanbanBoard tasks={mockTasks} />
      </main>
    </div>
  );
}

export default BoardPage;

import Sidebar from "./components/Sidebar";
import KanbanBoard from "./components/KanbanBoard";
import { currentUser, mockTasks } from "./mockData";

function App() {
  const handleLogout = (): void => {
    console.log("Logout clicked — will clear token here later");
  };

  return (
    <div className="flex bg-[#0E0F11] min-h-screen">
      <Sidebar user={currentUser} onLogout={handleLogout} />
      <main className="flex-1 p-8">
        <h1 className="text-[#F2F2F3] text-xl font-semibold mb-6">Board</h1>
        <KanbanBoard tasks={mockTasks} />
      </main>
    </div>
  );
}

export default App;

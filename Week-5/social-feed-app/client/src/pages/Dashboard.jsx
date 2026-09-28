import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            Welcome, {user.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            You're logged in. Your feed will appear here soon.
          </p>
        </div>
      </main>
    </div>
  );
}

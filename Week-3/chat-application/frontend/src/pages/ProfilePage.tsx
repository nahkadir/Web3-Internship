import { useState, type SubmitEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

const ProfilePage = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await apiRequest("/users/me", { method: "PATCH", body: { name } });
      setMessage("Profile updated");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-bg-ambient p-8">
      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-panel p-6 max-w-md mx-auto space-y-4"
      >
        <h1 className="text-h1 font-semibold">Profile</h1>
        {message && <p className="text-small text-text-secondary">{message}</p>}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-card bg-surface-muted px-4 py-2 text-body"
        />
        <button className="rounded-card bg-primary text-white px-4 py-2 text-body">
          Save
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;

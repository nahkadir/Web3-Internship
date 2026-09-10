import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      login({ _id: data._id, name: data.name, email: data.email }, data.token);
      navigate("/");
    } catch (err) {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center font-bold text-bg">
            K
          </div>
          <span className="text-text font-semibold text-h3">Kanban</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4"
        >
          <h1 className="text-text text-h4 font-medium mb-1">Log in</h1>

          {error && (
            <p className="text-priority-high text-small bg-priority-high/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-text-muted text-small">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body outline-none focus:border-border-hover"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-text-muted text-small">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-bg border border-border rounded-lg px-3 py-2 text-text text-body outline-none focus:border-border-hover"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-bg font-medium rounded-lg py-2 mt-2 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-ambient">
      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-panel p-8 w-full max-w-sm space-y-4"
      >
        <h1 className="text-h1 font-semibold">Create account</h1>

        {error && <p className="text-accent-warn text-small">{error}</p>}

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-card bg-surface-muted px-4 py-2 text-body"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-card bg-surface-muted px-4 py-2 text-body"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-card bg-surface-muted px-4 py-2 text-body"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-card bg-primary text-white py-2 text-body font-medium disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-small text-text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="text-primary">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;

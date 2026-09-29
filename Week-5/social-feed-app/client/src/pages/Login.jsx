import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FormField from "../components/FormField";
import { validateLogin } from "../utils/validators";

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateLogin(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await login(form);
    } catch (err) {
      if (err.errors?.length) {
        const fieldErrors = {};
        err.errors.forEach((e) => (fieldErrors[e.field] = e.message));
        setErrors(fieldErrors);
      } else {
        setApiError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-bg p-8">
        <h1 className="text-2xl font-semibold text-text">Welcome back</h1>
        <p className="mt-1 text-sm text-secondary">Log in to see your feed.</p>

        {location.state?.registered && !apiError && (
          <div className="mt-4 rounded-lg bg-green-950/40 px-3 py-2 text-sm text-green-400">
            Registration successful. Please log in.
          </div>
        )}
        {apiError && (
          <div className="mt-4 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <FormField
            label="Email"
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
          />
          <FormField
            label="Password"
            id="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-x-blue py-2 text-sm font-bold text-white transition hover:bg-x-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-secondary">
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-x-blue hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

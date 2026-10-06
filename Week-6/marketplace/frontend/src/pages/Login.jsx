import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DASHBOARD_PATH } from "../constants/roles";
import { ApiError } from "../lib/api";
import AuthCard from "../components/AuthCard";
import FormField from "../components/FormField";
import Button from "../components/Button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const notice = location.state?.message;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    else if (!EMAIL_RE.test(form.email.trim()))
      next.email = "Enter a valid email address";
    if (!form.password) next.password = "Password is required";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const user = await login({
        email: form.email.trim(),
        password: form.password,
      });
      navigate(DASHBOARD_PATH[user.role], { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors.length) {
          setErrors(
            Object.fromEntries(err.errors.map((x) => [x.field, x.message])),
          );
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError("Cannot reach the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Log in"
      subtitle="Welcome back. Enter your details to continue."
      footer={
        <>
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-midcurrent-navy underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {notice && (
          <p className="rounded-[30px] border border-cloud-veil px-5 py-2 text-[13px]">
            {notice}
          </p>
        )}
        {formError && (
          <p
            role="alert"
            className="rounded-[30px] border border-red-700 px-5 py-2 text-[13px] text-red-700"
          >
            {formError}
          </p>
        )}

        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <Button type="submit" loading={loading}>
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import AuthCard from "../components/AuthCard";
import FormField from "../components/FormField";
import Button from "../components/Button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    const { name, email, password, confirmPassword } = form;

    if (!name.trim()) next.name = "Name is required";
    else if (name.trim().length < 2)
      next.name = "Name must be at least 2 characters";

    if (!email.trim()) next.email = "Email is required";
    else if (!EMAIL_RE.test(email.trim()))
      next.email = "Enter a valid email address";

    if (!password) next.password = "Password is required";
    else if (password.length < 8)
      next.password = "Password must be at least 8 characters";
    else if (!/[a-z]/.test(password))
      next.password = "Password must contain a lowercase letter";
    else if (!/[A-Z]/.test(password))
      next.password = "Password must contain an uppercase letter";
    else if (!/[0-9]/.test(password))
      next.password = "Password must contain a number";

    if (!confirmPassword) next.confirmPassword = "Please confirm your password";
    else if (confirmPassword !== password)
      next.confirmPassword = "Passwords do not match";

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
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/login", {
        replace: true,
        state: { message: "Account created. Please log in." },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors.length) {
          setErrors(
            Object.fromEntries(err.errors.map((x) => [x.field, x.message])),
          );
        } else if (err.status === 409) {
          setErrors({ email: err.message });
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
      title="Create account"
      subtitle="Join the marketplace as a customer."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-midcurrent-navy underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && (
          <p
            role="alert"
            className="rounded-[30px] border border-red-700 px-5 py-2 text-[13px] text-red-700"
          >
            {formError}
          </p>
        )}

        <FormField
          id="name"
          label="Full name"
          autoComplete="name"
          placeholder="Your name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
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
          autoComplete="new-password"
          placeholder="Create a password"
          hint="At least 8 characters with upper, lower case and a number"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <FormField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}

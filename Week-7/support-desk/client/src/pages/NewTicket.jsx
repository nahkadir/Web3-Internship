import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import { CATEGORIES, label } from "../constants/ticket";
import { getErrorMessage } from "../utils/getErrorMessage";

export default function NewTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "GENERAL",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/tickets", form);
      navigate(`/tickets/${res.data.data.ticket._id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="New Ticket">
      <Link
        to="/customer"
        className="text-sm text-indigo-600 inline-block mb-4"
      >
        ← Back to my tickets
      </Link>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow space-y-4 max-w-2xl"
      >
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
        <input
          name="subject"
          placeholder="Subject"
          value={form.subject}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {label(c)}
            </option>
          ))}
        </select>
        <textarea
          name="description"
          rows={6}
          placeholder="Describe your issue in detail"
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
        <button
          disabled={submitting}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit ticket"}
        </button>
      </form>
    </DashboardLayout>
  );
}

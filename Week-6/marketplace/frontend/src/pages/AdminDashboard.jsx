import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { useApi } from "../hooks/useApi";
import { buildQuery, describeError, formatDate } from "../lib/utils";
import DashboardHeader from "../components/DashboardHeader";
import StatusBadge from "../components/StatusBadge";
import FormField from "../components/FormField";
import Pagination from "../components/Pagination";
import Button from "../components/Button";

const FILTERS = ["ALL", "PENDING", "APPROVED", "SUSPENDED", "REJECTED"];
const ACTIONS = {
  PENDING: [
    ["APPROVED", "Approve"],
    ["REJECTED", "Reject"],
  ],
  APPROVED: [["SUSPENDED", "Suspend"]],
  SUSPENDED: [["APPROVED", "Reactivate"]],
  REJECTED: [["APPROVED", "Approve"]],
};

const pill = (active) =>
  `cursor-pointer rounded-[30px] border px-4 py-2 text-[13px] font-medium ${
    active
      ? "border-midcurrent-navy bg-midcurrent-navy text-paper-white"
      : "border-cloud-veil bg-paper-white text-midcurrent-navy hover:border-soft-stone"
  }`;

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mt-4 rounded-[30px] border border-red-700 px-5 py-2 text-[13px] text-red-700"
    >
      {message}
    </p>
  );
}

function VendorsPanel() {
  const [filter, setFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");

  const { data, loading, error, reload } = useApi(
    `/admin/vendors${buildQuery({ status: filter === "ALL" ? "" : filter, page, limit: 10 })}`,
  );

  const changeStatus = async (vendor, status, label) => {
    if (
      ["REJECTED", "SUSPENDED"].includes(status) &&
      !window.confirm(`${label} "${vendor.storeName}"?`)
    )
      return;
    setActionError("");
    setBusyId(vendor.id);
    try {
      await api(`/admin/vendors/${vendor.id}/status`, {
        method: "PATCH",
        body: { status },
      });
      reload();
    } catch (err) {
      setActionError(describeError(err));
    } finally {
      setBusyId("");
    }
  };

  return (
    <section>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={pill(filter === f)}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <ErrorBanner message={actionError || error?.message} />

      <div className="mt-4 overflow-x-auto bg-paper-white">
        {data?.vendors.length === 0 ? (
          <p className="px-4 py-12 text-center text-[15px] text-slate-gray">
            No vendors in this view.
          </p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead className="border-b border-cloud-veil text-[12px] text-slate-gray">
              <tr>
                <th className="p-4 font-medium">Store</th>
                <th className="p-4 font-medium">Owner</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Applied</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud-veil">
              {(data?.vendors ?? []).map((v) => (
                <tr key={v.id}>
                  <td className="p-4">
                    <p className="font-medium">{v.storeName}</p>
                    {v.storeDescription && (
                      <p className="line-clamp-1 max-w-[260px] text-[12px] text-slate-gray">
                        {v.storeDescription}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <p>{v.user?.name}</p>
                    <p className="text-[12px] text-slate-gray">
                      {v.user?.email}
                    </p>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="p-4 text-slate-gray">
                    {formatDate(v.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {ACTIONS[v.status].map(([status, label], i) => (
                        <Button
                          key={status}
                          type="button"
                          size="sm"
                          variant={i === 0 ? "primary" : "ghost"}
                          disabled={busyId === v.id}
                          onClick={() => changeStatus(v, status, label)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {loading && !data && (
          <p className="px-4 py-12 text-center text-slate-gray">Loading...</p>
        )}
      </div>
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </section>
  );
}

function CategoriesPanel() {
  const { data, loading, error, reload } = useApi("/categories");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState({});
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError("");
    if (form.name.trim().length < 2) {
      setErrors({ name: "Name must be at least 2 characters" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
      };
      await api(editing ? `/categories/${editing.id}` : "/categories", {
        method: editing ? "PATCH" : "POST",
        body,
      });
      reset();
      reload();
    } catch (err) {
      if (err instanceof ApiError && err.errors.length) {
        setErrors(
          Object.fromEntries(err.errors.map((x) => [x.field, x.message])),
        );
      } else {
        setActionError(describeError(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setActionError("");
    try {
      await api(`/categories/${c.id}`, { method: "DELETE" });
      if (editing?.id === c.id) reset();
      reload();
    } catch (err) {
      setActionError(describeError(err)); // e.g. category still used by products
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex h-fit flex-col gap-5 bg-paper-white p-6"
      >
        <h2 className="text-[20px] font-bold leading-[1.2]">
          {editing ? "Edit category" : "Add category"}
        </h2>
        <FormField
          id="name"
          label="Name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
        <FormField
          as="textarea"
          id="description"
          label="Description"
          value={form.description}
          onChange={handleChange}
          error={errors.description}
        />
        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            {editing ? "Save" : "Add category"}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div>
        <ErrorBanner message={actionError || error?.message} />
        <div className="overflow-x-auto bg-paper-white">
          {loading && !data ? (
            <p className="px-4 py-12 text-center text-slate-gray">Loading...</p>
          ) : data?.categories.length === 0 ? (
            <p className="px-4 py-12 text-center text-slate-gray">
              No categories yet.
            </p>
          ) : (
            <table className="w-full min-w-[520px] text-left text-[14px]">
              <thead className="border-b border-cloud-veil text-[12px] text-slate-gray">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Slug</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud-veil">
                {data?.categories.map((c) => (
                  <tr key={c.id}>
                    <td className="p-4">
                      <p className="font-medium">{c.name}</p>
                      {c.description && (
                        <p className="text-[12px] text-slate-gray">
                          {c.description}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-slate-gray">{c.slug}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(c);
                            setForm({
                              name: c.name,
                              description: c.description || "",
                            });
                            setErrors({});
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(c)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("vendors");

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12">
      <DashboardHeader label="Admin area" title="Admin Dashboard" user={user} />

      <div className="mb-6 mt-8 flex gap-2">
        <button
          type="button"
          className={pill(tab === "vendors")}
          onClick={() => setTab("vendors")}
        >
          Vendors
        </button>
        <button
          type="button"
          className={pill(tab === "categories")}
          onClick={() => setTab("categories")}
        >
          Categories
        </button>
      </div>

      {tab === "vendors" ? <VendorsPanel /> : <CategoriesPanel />}
    </div>
  );
}

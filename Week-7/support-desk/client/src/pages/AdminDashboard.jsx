import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import { getErrorMessage } from "../utils/getErrorMessage";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api
      .get("/admin/users", { params: { page, limit: 10 } })
      .then((res) => {
        if (ignore) return;
        setUsers(res.data.data.users);
        setPagination(res.data.data.pagination);
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [page]);

  const changeRole = async (id, role) => {
    setError("");
    try {
      const res = await api.patch(`/admin/users/${id}/role`, { role });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? res.data.data.user : u)),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <Link
        to="/admin/tickets"
        className="text-sm text-indigo-600 inline-block mb-4"
      >
        Manage tickets →
      </Link>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <h2 className="text-base font-semibold p-4 border-b">
          User management
        </h2>
        {error && (
          <p className="m-4 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </p>
        )}
        {loading ? (
          <p className="p-4 text-gray-500">Loading users...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      disabled={u._id === me._id}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                      className="border rounded-lg px-2 py-1 disabled:bg-gray-100"
                    >
                      {Object.values(ROLES).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex items-center justify-between p-4 border-t text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

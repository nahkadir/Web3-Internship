import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import UserRow from "../components/UserRow";
import { searchUsers } from "../api/users";

export default function Search() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setSearched(false);
      return;
    }
    const timeout = setTimeout(() => {
      setLoading(true);
      setError("");
      searchUsers(query.trim())
        .then((data) => setUsers(data.users))
        .catch((err) => setError(err.message))
        .finally(() => {
          setLoading(false);
          setSearched(true);
        });
    }, 350); // debounce so we don't fire a request on every keystroke

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <>
      <h1 className="sticky top-0 z-10 border-b border-hairline bg-bg/80 px-4 py-3 text-xl font-extrabold text-text backdrop-blur">
        Search
      </h1>

      <div className="border-b border-hairline p-4">
        <div className="flex items-center gap-2 rounded-full bg-hover px-4 py-2">
          <SearchIcon size={18} className="text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="w-full border-none bg-transparent text-[15px] text-text placeholder:text-secondary outline-none"
          />
        </div>
      </div>

      {loading && (
        <p className="px-4 py-6 text-center text-secondary">Searching...</p>
      )}
      {error && <p className="px-4 py-6 text-center text-red-500">{error}</p>}
      {!loading && searched && users.length === 0 && (
        <p className="px-4 py-10 text-center text-secondary">No users found.</p>
      )}

      {users.map((u) => (
        <UserRow key={u.id} user={u} />
      ))}
    </>
  );
}

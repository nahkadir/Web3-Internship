import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import UserRow from "./UserRow";
import { useAuth } from "../context/AuthContext";
import { searchUsers } from "../api/users";

export default function RightSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchUsers("") // empty search = all users, alphabetical
      .then((data) => {
        const filtered = data.users
          .filter((u) => u.id !== user?.id && !u.isFollowing)
          .slice(0, 3);
        setSuggestions(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate("/search");
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[350px] shrink-0 flex-col gap-4 py-2 pl-4 xl:flex">
      <form onSubmit={handleSearchSubmit}>
        <div className="flex items-center gap-2 rounded-full border border-hairline bg-bg px-4 py-2.5">
          <SearchIcon size={18} className="text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full border-none bg-transparent text-[15px] text-text placeholder:text-secondary outline-none"
          />
        </div>
      </form>

      <div className="rounded-2xl border border-hairline">
        <h2 className="px-4 py-3 text-xl font-extrabold text-text">
          Who to follow
        </h2>

        {loading && (
          <p className="px-4 pb-4 text-sm text-secondary">Loading...</p>
        )}
        {!loading && suggestions.length === 0 && (
          <p className="px-4 pb-4 text-sm text-secondary">
            No suggestions right now.
          </p>
        )}
        {suggestions.map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
      </div>
    </aside>
  );
}

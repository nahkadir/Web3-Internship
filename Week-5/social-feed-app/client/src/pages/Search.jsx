import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import UserRow from "../components/UserRow";
import { searchUsers } from "../api/users";
import { getFeed } from "../api/posts";
import PostCard from "../components/PostCard";

export default function Search() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [tab, setTab] = useState("people"); // "people" | "posts"
  const [postResults, setPostResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setPostResults([]);
      setSearched(false);
      return;
    }
    const timeout = setTimeout(() => {
      setLoading(true);
      setError("");
      const request =
        tab === "people"
          ? searchUsers(query.trim())
          : getFeed(1, 10, query.trim());

      request
        .then((data) =>
          tab === "people" ? setUsers(data.users) : setPostResults(data.posts),
        )
        .catch((err) => setError(err.message))
        .finally(() => {
          setLoading(false);
          setSearched(true);
        });
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, tab]);

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

      <div className="flex border-b border-hairline">
        <button
          onClick={() => setTab("people")}
          className={`flex-1 py-3 text-sm font-bold ${tab === "people" ? "border-b-2 border-x-blue text-text" : "text-secondary"}`}
        >
          People
        </button>
        <button
          onClick={() => setTab("posts")}
          className={`flex-1 py-3 text-sm font-bold ${tab === "posts" ? "border-b-2 border-x-blue text-text" : "text-secondary"}`}
        >
          Posts
        </button>
      </div>

      {!loading && searched && tab === "people" && users.length === 0 && (
        <p className="px-4 py-10 text-center text-secondary">No users found.</p>
      )}
      {!loading && searched && tab === "posts" && postResults.length === 0 && (
        <p className="px-4 py-10 text-center text-secondary">No posts found.</p>
      )}

      {tab === "people" && users.map((u) => <UserRow key={u.id} user={u} />)}
      {tab === "posts" &&
        postResults.map((p) => (
          <PostCard key={p.id} post={p} onEdit={() => {}} onDelete={() => {}} />
        ))}
    </>
  );
}

import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import UserRow from "../components/UserRow";
import { getFollowers, getFollowing } from "../api/users";

export default function FollowList() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type =
    searchParams.get("type") === "following" ? "following" : "followers";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const fetcher = type === "following" ? getFollowing : getFollowers;
    fetcher(id)
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, type]);

  return (
    <>
      <h1 className="sticky top-0 z-10 flex items-center gap-4 border-b border-hairline bg-bg/80 px-4 py-3 backdrop-blur">
        <Link to={`/users/${id}`} className="text-text hover:text-x-blue">
          ←
        </Link>
        <span className="text-xl font-extrabold text-text capitalize">
          {type}
        </span>
      </h1>

      {loading && (
        <p className="px-4 py-6 text-center text-secondary">Loading...</p>
      )}
      {error && <p className="px-4 py-6 text-center text-red-500">{error}</p>}
      {!loading && users.length === 0 && (
        <p className="px-4 py-10 text-center text-secondary">
          {type === "following"
            ? "Not following anyone yet."
            : "No followers yet."}
        </p>
      )}
      {users.map((u) => (
        <UserRow key={u.id} user={u} />
      ))}
    </>
  );
}

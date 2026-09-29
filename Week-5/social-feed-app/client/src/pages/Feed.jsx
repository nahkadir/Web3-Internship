import { useEffect, useState } from "react";
import PostComposer from "../components/PostComposer";
import PostCard from "../components/PostCard";
import EditPostModal from "../components/EditPostModal";
import { getFeed, deletePost as deletePostApi } from "../api/posts";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [editingPost, setEditingPost] = useState(null);

  const loadPage = (pageNum) =>
    getFeed(pageNum).then((data) => {
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const fresh = data.posts.filter((p) => !existingIds.has(p.id));
        return pageNum === 1 ? data.posts : [...prev, ...fresh];
      });
      setHasMore(data.pagination.hasMore);
      setPage(data.pagination.page);
    });

  useEffect(() => {
    loadPage(1)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await loadPage(page + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostCreated = (post) => setPosts((prev) => [post, ...prev]);

  const handleUpdated = (updated) =>
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const handleDelete = async (post) => {
    if (!confirm("Delete this post?")) return;
    try {
      await deletePostApi(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <h1 className="sticky top-0 z-10 border-b border-hairline bg-bg/80 px-4 py-3 text-xl font-extrabold text-text backdrop-blur">
        Home
      </h1>

      <PostComposer onPostCreated={handlePostCreated} />

      {loading && (
        <p className="px-4 py-6 text-center text-secondary">Loading feed...</p>
      )}
      {error && <p className="px-4 py-6 text-center text-red-500">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="px-4 py-10 text-center text-secondary">
          No posts yet. Be the first to post!
        </p>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onEdit={setEditingPost}
          onDelete={handleDelete}
        />
      ))}

      {!loading && !error && (
        <div className="px-4 py-6 text-center">
          {hasMore ? (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-full border border-hairline px-4 py-2 text-sm font-bold text-x-blue hover:bg-hover disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          ) : (
            posts.length > 0 && (
              <p className="text-sm text-secondary">You're all caught up</p>
            )
          )}
        </div>
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  );
}

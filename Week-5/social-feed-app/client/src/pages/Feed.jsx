import { useEffect, useState } from "react";
import PostComposer from "../components/PostComposer";
import PostCard from "../components/PostCard";
import EditPostModal from "../components/EditPostModal";
import { getFeed, deletePost as deletePostApi } from "../api/posts";
import { getPersonalizedFeed } from "../api/feed";

// Step 2's two fetchers, mapped by tab name — this is the only new "wiring" idea
const FEED_FETCHERS = {
  forYou: (page) => getFeed(page),
  following: (page) => getPersonalizedFeed(page),
};

export default function Feed() {
  const [tab, setTab] = useState("forYou"); // Step 3: which feed is active
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [editingPost, setEditingPost] = useState(null);

  const loadPage = (pageNum) =>
    FEED_FETCHERS[tab](pageNum).then((data) => {
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const fresh = data.posts.filter((p) => !existingIds.has(p.id));
        return pageNum === 1 ? data.posts : [...prev, ...fresh];
      });
      setHasMore(data.pagination.hasMore);
      setPage(data.pagination.page);
    });

  // Whenever `tab` changes, reset and refetch from page 1 with the new fetcher
  useEffect(() => {
    setLoading(true);
    setError("");
    setPosts([]);
    loadPage(1)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tab]);

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

  const handlePostCreated = (post) => {
    if (tab === "forYou") setPosts((prev) => [post, ...prev]);
    // if you're viewing "Following", your own new post won't auto-appear there
    // unless you follow yourself — that's expected, not a bug
  };

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

  const tabClass = (name) =>
    `flex-1 py-4 text-center text-[15px] font-bold transition hover:bg-hover ${
      tab === name ? "text-text" : "text-secondary"
    }`;

  return (
    <>
      {/* Step 4: the UI — two buttons that just call setTab */}
      <div className="sticky top-0 z-10 flex border-b border-hairline bg-bg/80 backdrop-blur">
        <button
          onClick={() => setTab("forYou")}
          className={`${tabClass("forYou")} cursor-pointer`}
        >
          <span className="relative">
            For you
            {tab === "forYou" && (
              <span className="absolute -bottom-4 left-0 h-1 w-full rounded-full bg-x-blue" />
            )}
          </span>
        </button>
        <button
          onClick={() => setTab("following")}
          className={`${tabClass("following")} cursor-pointer`}
        >
          <span className="relative">
            Following
            {tab === "following" && (
              <span className="absolute -bottom-4 left-0 h-1 w-full rounded-full bg-x-blue" />
            )}
          </span>
        </button>
      </div>

      <PostComposer onPostCreated={handlePostCreated} />

      {loading && (
        <p className="px-4 py-6 text-center text-secondary">Loading feed...</p>
      )}
      {error && <p className="px-4 py-6 text-center text-red-500">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="px-4 py-10 text-center text-secondary">
          {tab === "following"
            ? "No posts from people you follow yet. Try the Search tab to find people."
            : "No posts yet. Be the first to post!"}
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

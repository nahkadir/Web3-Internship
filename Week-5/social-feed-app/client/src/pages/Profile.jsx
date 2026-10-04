import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { getMyProfile, updateMyProfile } from "../api/users";
import { getFeed } from "../api/posts";
import { getPostsByAuthor } from "../api/posts";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function Profile() {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", avatar: "" });
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    const { user } = await getMyProfile();
    const { posts: myPosts } = await getPostsByAuthor(user.id);
    setProfile(user);
    setPosts(myPosts);
  };

  useEffect(() => {
    loadProfile()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openEdit = () => {
    setForm({
      name: profile.name,
      bio: profile.bio || "",
      avatar: profile.avatar || "",
    });
    setSaveError("");
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setSaveError("Name cannot be empty");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const { user: updated } = await updateMyProfile({
        name: form.name.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar.trim(),
      });
      setProfile((p) => ({ ...p, ...updated }));
      setUser?.((u) =>
        u ? { ...u, name: updated.name, avatar: updated.avatar } : u,
      ); // keep sidebar in sync
      setEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditPost = () => {}; // post edit handled from the feed card itself
  const handleDeletePost = async (post) => {
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  };

  return (
    <>
      <h1 className="sticky top-0 z-10 border-b border-hairline bg-bg/80 px-4 py-3 text-xl font-extrabold text-text backdrop-blur">
        Profile
      </h1>

      {loading && (
        <p className="px-4 py-6 text-center text-secondary">
          Loading profile...
        </p>
      )}
      {error && <p className="px-4 py-6 text-center text-red-500">{error}</p>}

      {profile && (
        <>
          <div className="border-b border-hairline p-4">
            <div className="flex items-start justify-between">
              <Avatar
                src={profile.avatar}
                name={profile.name}
                size="h-20 w-20"
                textSize="text-2xl"
              />
              <button
                onClick={openEdit}
                className="rounded-full border border-hairline px-4 py-1.5 text-sm font-bold text-text hover:bg-hover"
              >
                Edit profile
              </button>
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-text">
              {profile.name}
            </h2>
            <p className="text-sm text-secondary">{profile.email}</p>
            {profile.bio && (
              <p className="mt-1 text-[15px] text-text">{profile.bio}</p>
            )}
            <p className="mt-2 text-sm text-secondary">
              Joined {formatDate(profile.createdAt)}
            </p>

            <div className="mt-3 flex gap-4 text-sm">
              <Link
                to={`/users/${profile.id}/follow-list?type=following`}
                className="text-text hover:underline"
              >
                <span className="font-bold">{profile.followingCount ?? 0}</span>{" "}
                <span className="text-secondary">Following</span>
              </Link>
              <Link
                to={`/users/${profile.id}/follow-list?type=followers`}
                className="text-text hover:underline"
              >
                <span className="font-bold">{profile.followersCount ?? 0}</span>{" "}
                <span className="text-secondary">Followers</span>
              </Link>
              <span className="text-secondary">
                <span className="font-bold text-text">{posts.length}</span>{" "}
                Posts
              </span>
            </div>
          </div>

          {posts.length === 0 ? (
            <p className="px-4 py-10 text-center text-secondary">
              No posts yet.
            </p>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
              />
            ))
          )}
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-hairline bg-bg p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setEditing(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-text hover:bg-hover"
              >
                ✕
              </button>
              <span className="text-[15px] font-bold text-text">
                Edit profile
              </span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-text px-4 py-1.5 text-sm font-bold text-bg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-secondary">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-md border border-hairline bg-hover px-3 py-2 text-sm text-text outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-secondary">
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  rows={3}
                  maxLength={160}
                  className="w-full resize-none rounded-md border border-hairline bg-hover px-3 py-2 text-sm text-text outline-none"
                />
                <p className="mt-1 text-right text-xs text-secondary">
                  {form.bio.length}/160
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-secondary">
                  Avatar URL
                </label>
                <input
                  value={form.avatar}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, avatar: e.target.value }))
                  }
                  placeholder="https://..."
                  className="w-full rounded-md border border-hairline bg-hover px-3 py-2 text-sm text-text outline-none"
                />
              </div>

              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

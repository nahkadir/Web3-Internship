import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import FollowButton from "../components/FollowButton";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { getPublicProfile } from "../api/users";
import { getFeed } from "../api/posts";
import { getPostsByAuthor } from "../api/posts";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long" });

export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([getPublicProfile(id), getPostsByAuthor(id)])
      .then(([profileData, postsData]) => {
        setProfile(profileData.user);
        setPosts(postsData.posts);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEdit = () => {}; // own posts aren't editable from here; only from the feed
  const handleDelete = () => {};

  if (me?.id === id) return <Navigate to="/profile" replace />;

  return (
    <>
      <h1 className="sticky top-0 z-10 border-b border-hairline bg-bg/80 px-4 py-3 text-xl font-extrabold text-text backdrop-blur">
        {profile?.name || "Profile"}
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
              <FollowButton
                userId={profile.id}
                isFollowing={profile.isFollowing}
                onChange={(r) =>
                  setProfile((p) => ({
                    ...p,
                    followersCount: r.followersCount,
                    isFollowing: r.isFollowing,
                  }))
                }
              />
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-text">
              {profile.name}
            </h2>
            {profile.bio && (
              <p className="mt-1 text-[15px] text-text">{profile.bio}</p>
            )}
            <p className="mt-2 text-sm text-secondary">
              Joined {formatDate(profile.createdAt)}
            </p>

            <div className="mt-3 flex gap-4 text-sm">
              <Link
                to={`/users/${id}/follow-list?type=following`}
                className="text-text hover:underline"
              >
                <span className="font-bold">{profile.followingCount}</span>{" "}
                <span className="text-secondary">Following</span>
              </Link>
              <Link
                to={`/users/${id}/follow-list?type=followers`}
                className="text-text hover:underline"
              >
                <span className="font-bold">{profile.followersCount}</span>{" "}
                <span className="text-secondary">Followers</span>
              </Link>
              <span className="text-secondary">
                <span className="font-bold text-text">{profile.postCount}</span>{" "}
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
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </>
      )}
    </>
  );
}

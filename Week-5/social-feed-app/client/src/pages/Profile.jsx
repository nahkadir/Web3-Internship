import { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import { getMyProfile } from "../api/users";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyProfile()
      .then((data) => setProfile(data.user))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
        <div className="p-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar
              src={profile.avatar}
              name={profile.name}
              size="h-24 w-24"
              textSize="text-3xl"
            />

            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-semibold text-text">
                {profile.name}
              </h2>
              <p className="text-sm text-secondary">{profile.email}</p>
              <p className="mt-3 text-sm text-text">
                {profile.bio || (
                  <span className="text-secondary">No bio yet.</span>
                )}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-hairline pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-secondary">Member since</dt>
              <dd className="font-medium text-text">
                {formatDate(profile.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-secondary">Last updated</dt>
              <dd className="font-medium text-text">
                {formatDate(profile.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </>
  );
}

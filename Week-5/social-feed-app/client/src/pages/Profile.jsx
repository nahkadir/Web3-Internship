import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8">
        {loading && (
          <p className="text-center text-gray-500">Loading profile...</p>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {profile && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar src={profile.avatar} name={profile.name} />

              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {profile.name}
                </h1>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <p className="mt-3 text-sm text-gray-700">
                  {profile.bio || (
                    <span className="text-gray-400">No bio yet.</span>
                  )}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-400">Member since</dt>
                <dd className="font-medium text-gray-800">
                  {formatDate(profile.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Last updated</dt>
                <dd className="font-medium text-gray-800">
                  {formatDate(profile.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </main>
    </div>
  );
}

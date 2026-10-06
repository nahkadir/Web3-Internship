import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function RoleDashboard({ title, endpoint, abilities }) {
  const { user } = useAuth();
  const [check, setCheck] = useState({ loading: true, message: "", error: "" });

  useEffect(() => {
    api(endpoint)
      .then((data) =>
        setCheck({ loading: false, message: data.message, error: "" }),
      )
      .catch((err) =>
        setCheck({ loading: false, message: "", error: err.message }),
      );
  }, [endpoint]);

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12">
      <p className="text-[11px] font-medium uppercase">{user.role} area</p>
      <h1 className="mt-2 text-[44px] font-bold leading-[1.1]">{title}</h1>
      <p className="mt-2 text-[16px] text-slate-gray">
        Welcome back, {user.name}.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <section className="bg-paper-white p-6">
          <h2 className="text-[20px] font-bold leading-[1.2]">Account</h2>
          <dl className="mt-4 divide-y divide-cloud-veil text-[15px]">
            <div className="flex justify-between py-3">
              <dt className="text-slate-gray">Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-slate-gray">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-slate-gray">Role</dt>
              <dd className="rounded-[30px] border border-cloud-veil px-3 py-0.5 text-[13px] font-medium">
                {user.role}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-slate-gray">Member since</dt>
              <dd>{memberSince}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-paper-white p-6">
          <h2 className="text-[20px] font-bold leading-[1.2]">
            What you can do
          </h2>
          <ul className="mt-4 divide-y divide-cloud-veil text-[15px]">
            {abilities.map((item) => (
              <li key={item} className="py-3">
                ✓ {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="mt-4 text-[13px] text-slate-gray">
        Server check:{" "}
        {check.loading
          ? "verifying..."
          : check.error
            ? check.error
            : check.message}
      </p>
    </div>
  );
}

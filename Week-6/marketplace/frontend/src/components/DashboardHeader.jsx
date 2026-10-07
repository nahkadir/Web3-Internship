export default function DashboardHeader({ label, title, user }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase">{label}</p>
      <h1 className="mt-2 text-[44px] font-bold leading-[1.1]">{title}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-[15px] text-slate-gray">
        <span>{user.name}</span>
        <span>·</span>
        <span>{user.email}</span>
        <span className="rounded-[30px] border border-cloud-veil px-3 py-0.5 text-[12px] font-medium text-midcurrent-navy">
          {user.role}
        </span>
      </p>
    </div>
  );
}

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto flex max-w-[1200px] justify-center px-4 py-16">
      <div className="w-full max-w-md bg-paper-white p-8">
        <h1 className="text-[30px] font-bold leading-[1.1]">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-[16px] text-slate-gray">{subtitle}</p>
        )}
        <div className="mt-8">{children}</div>
        {footer && (
          <p className="mt-6 text-center text-[14px] text-slate-gray">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}

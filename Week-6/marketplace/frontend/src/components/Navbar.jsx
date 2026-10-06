import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DASHBOARD_PATH } from "../constants/roles";
import { BRAND_NAME } from "../constants/brand";
import Button from "./Button";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="border-b border-cloud-veil bg-paper-white">
      <div className="mx-auto grid h-16 max-w-[1200px] grid-cols-3 items-center px-4">
        <nav className="flex gap-6 text-[14px] text-graphite">
          {user && <Link to={DASHBOARD_PATH[user.role]}>Dashboard</Link>}
        </nav>

        <Link
          to="/"
          className="justify-self-center text-[20px] font-black text-graphite"
        >
          {BRAND_NAME}
        </Link>

        <div className="flex items-center justify-end gap-4 text-[14px] text-graphite">
          {user ? (
            <>
              <span className="hidden text-slate-gray sm:inline">
                {user.name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link
                to="/register"
                className="rounded-[30px] bg-midcurrent-navy px-4 py-2 font-medium text-paper-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

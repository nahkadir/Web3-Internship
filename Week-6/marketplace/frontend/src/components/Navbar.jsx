import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { DASHBOARD_PATH, ROLES } from "../constants/roles";
import { BRAND_NAME } from "../constants/brand";
import Button from "./Button";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="border-b border-cloud-veil bg-paper-white">
      <div className="mx-auto grid h-16 max-w-[1200px] grid-cols-3 items-center px-4">
        <nav className="flex items-center gap-4 text-[14px] text-graphite sm:gap-6">
          <Link to="/products">Shop</Link>
          {user && <Link to={DASHBOARD_PATH[user.role]}>Dashboard</Link>}
          {user && (
            <Link to="/orders" className="hidden sm:inline">
              Orders
            </Link>
          )}
          {user?.role === ROLES.VENDOR && (
            <Link to="/vendor/orders" className="hidden md:inline">
              Store orders
            </Link>
          )}
        </nav>

        <Link
          to="/products"
          className="justify-self-center text-[20px] font-black text-graphite"
        >
          {BRAND_NAME}
        </Link>

        <div className="flex items-center justify-end gap-4 text-[14px] text-graphite">
          {user ? (
            <>
              <Link
                to="/cart"
                className="flex items-center gap-1.5"
                aria-label={`Cart, ${cart.itemCount} items`}
              >
                Cart
                <span className="min-w-5 rounded-[30px] bg-midcurrent-navy px-1.5 text-center text-[11px] font-medium leading-5 text-paper-white">
                  {cart.itemCount}
                </span>
              </Link>
              <span className="hidden text-slate-gray lg:inline">
                {user.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
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

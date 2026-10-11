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
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link
          to="/products"
          className="order-1 text-[20px] font-black text-graphite"
        >
          {BRAND_NAME}
        </Link>

        <div className="order-2 flex items-center gap-3 text-[14px] text-graphite sm:order-3">
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

        <nav className="order-3 flex w-full items-center gap-5 text-[14px] text-graphite sm:order-2 sm:w-auto sm:flex-1">
          <Link to="/products">Shop</Link>
          {user && <Link to={DASHBOARD_PATH[user.role]}>Dashboard</Link>}
          {user && <Link to="/orders">Orders</Link>}
          {user?.role === ROLES.VENDOR && (
            <Link to="/vendor/orders">Store orders</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

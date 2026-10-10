import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/utils";
import ProductImage from "../components/ProductImage";
import TotalsBlock from "../components/TotalsBlock";
import Button from "../components/Button";

export default function Checkout() {
  const { cart, ready, refresh } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [problems, setProblems] = useState([]);

  // always review the freshest prices and stock
  useEffect(() => {
    refresh();
  }, [refresh]);

  const placeOrder = async () => {
    setPlacing(true);
    setError("");
    setProblems([]);
    try {
      const data = await api("/checkout", { method: "POST" }); // the server rebuilds everything from the DB
      navigate(`/orders/${data.order.id}/payment`, { replace: true });
      refresh();
    } catch (err) {
      setError(err.message || "Could not place your order");
      setProblems((err.errors ?? []).map((e) => e.message));
      refresh();
    } finally {
      setPlacing(false);
    }
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-slate-gray">
        Loading...
      </div>
    );
  }

  if (cart.itemCount === 0) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16">
        <div className="bg-paper-white px-4 py-16 text-center">
          <h1 className="text-[30px] font-bold leading-[1.1]">
            Nothing to check out
          </h1>
          <p className="mt-2 text-[15px] text-slate-gray">
            Your cart is empty.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-block font-medium underline"
          >
            Browse the marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <h1 className="text-[44px] font-bold leading-[1.1]">Checkout</h1>
      <p className="mt-2 text-[15px] text-slate-gray">
        Review your order before placing it.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 border-l-4 border-red-700 bg-paper-white p-4"
        >
          <p className="text-[14px] font-medium text-red-700">{error}</p>
          {problems.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-[13px] text-red-700">
              {problems.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          {cart.groups.map((group) => (
            <section
              key={group.vendor.id ?? "unavailable"}
              className="bg-paper-white"
            >
              <header className="border-b border-cloud-veil p-4">
                <p className="text-[11px] text-slate-gray">Sold by</p>
                <p className="text-[16px] font-medium">
                  {group.vendor.storeName}
                </p>
              </header>
              <ul className="divide-y divide-cloud-veil px-4">
                {group.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden bg-morning-mist">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[14px] font-medium">
                        {item.name}
                      </p>
                      <p className="text-[13px] text-slate-gray">
                        {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                      {item.issue && (
                        <p className="text-[12px] text-red-700">{item.issue}</p>
                      )}
                    </div>
                    <p className="text-[14px] font-bold">
                      {formatPrice(item.subtotal)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="bg-paper-white p-4">
            <h2 className="text-[16px] font-bold">Payment method</h2>
            <div className="mt-3 flex items-start gap-3 rounded-[20px] border border-midcurrent-navy p-4">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-midcurrent-navy" />
              <div>
                <p className="text-[14px] font-medium">Online payment</p>
                <p className="text-[13px] text-slate-gray">
                  After placing your order you'll pay on our secure payment
                  page. Your order is confirmed once the payment is verified.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit bg-paper-white p-6 lg:sticky lg:top-6">
          <h2 className="text-[20px] font-bold leading-[1.2]">Order total</h2>
          <div className="mt-4">
            <TotalsBlock totals={cart.totals} />
          </div>

          {cart.hasIssues && (
            <p role="alert" className="mt-3 text-[13px] text-red-700">
              Some items need attention.{" "}
              <Link to="/cart" className="font-medium underline">
                Review your cart
              </Link>
            </p>
          )}

          <Button
            type="button"
            className="mt-6 w-full"
            loading={placing}
            disabled={cart.hasIssues}
            onClick={placeOrder}
          >
            Place order and continue to payment
          </Button>
          <Link
            to="/cart"
            className="mt-4 block text-center text-[13px] underline"
          >
            Back to cart
          </Link>
        </aside>
      </div>
    </div>
  );
}

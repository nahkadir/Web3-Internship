import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { describeError, formatPrice } from "../lib/utils";
import ProductImage from "../components/ProductImage";
import QuantityStepper from "../components/QuantityStepper";
import TotalsBlock from "../components/TotalsBlock";
import Button from "../components/Button";

export default function Cart() {
  const { cart, ready, updateItem, removeItem, refresh } = useCart();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const run = async (itemId, fn) => {
    setBusyId(itemId);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(describeError(err)); // e.g. "Only 2 left in stock"
      refresh(); // re-sync with the real stock and prices
    } finally {
      setBusyId("");
    }
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-slate-gray">
        Loading your cart...
      </div>
    );
  }

  if (cart.itemCount === 0) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16">
        <div className="bg-paper-white px-4 py-16 text-center">
          <h1 className="text-[30px] font-bold leading-[1.1]">
            Your cart is empty
          </h1>
          <p className="mt-2 text-[15px] text-slate-gray">
            Browse the marketplace and add something you like.
          </p>
          <Button
            type="button"
            className="mt-6"
            onClick={() => navigate("/products")}
          >
            Start shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <h1 className="text-[44px] font-bold leading-[1.1]">Your cart</h1>
      <p className="mt-2 text-[15px] text-slate-gray">
        {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"} from{" "}
        {cart.groups.length} store
        {cart.groups.length === 1 ? "" : "s"}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-[30px] border border-red-700 px-5 py-2 text-[13px] text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          {cart.groups.map((group) => (
            <section
              key={group.vendor.id ?? "unavailable"}
              className="bg-paper-white"
            >
              <header className="flex items-center justify-between border-b border-cloud-veil p-4">
                <div>
                  <p className="text-[11px] text-slate-gray">Sold by</p>
                  {group.vendor.id ? (
                    <Link
                      to={`/vendor/${group.vendor.id}`}
                      className="text-[16px] font-medium hover:underline"
                    >
                      {group.vendor.storeName}
                    </Link>
                  ) : (
                    <p className="text-[16px] font-medium">
                      {group.vendor.storeName}
                    </p>
                  )}
                </div>
                <p className="text-[13px] text-slate-gray">
                  Store subtotal {formatPrice(group.subtotal)}
                </p>
              </header>

              <ul className="divide-y divide-cloud-veil px-4">
                {group.items.map((item) => {
                  const unavailable = !item.productId || item.stock === 0;
                  const busy = busyId === item.id;
                  return (
                    <li
                      key={item.id}
                      className={`flex gap-4 py-4 ${busy ? "opacity-60" : ""}`}
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden bg-morning-mist">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        {item.productId ? (
                          <Link
                            to={`/products/${item.productId}`}
                            className="line-clamp-2 text-[15px] font-medium"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span className="text-[15px] font-medium text-slate-gray">
                            {item.name}
                          </span>
                        )}
                        <p className="text-[13px] text-slate-gray">
                          {formatPrice(item.unitPrice)} each
                        </p>
                        {item.issue && (
                          <p role="alert" className="text-[12px] text-red-700">
                            {item.issue}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-4">
                          <QuantityStepper
                            value={item.quantity}
                            max={item.stock}
                            disabled={busy || unavailable}
                            onChange={(q) =>
                              run(item.id, () => updateItem(item.id, q))
                            }
                          />
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              run(item.id, () => removeItem(item.id))
                            }
                            className="cursor-pointer text-[13px] text-slate-gray underline disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <p className="text-[15px] font-bold">
                        {formatPrice(item.subtotal)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <aside className="h-fit bg-paper-white p-6 lg:sticky lg:top-6">
          <h2 className="text-[20px] font-bold leading-[1.2]">Order summary</h2>
          <div className="mt-4">
            <TotalsBlock totals={cart.totals} compact />
          </div>
          <p className="mt-3 text-[12px] text-slate-gray">
            Shipping and taxes are calculated at checkout.
          </p>

          {cart.hasIssues && (
            <p role="alert" className="mt-3 text-[13px] text-red-700">
              Fix or remove the highlighted items to continue.
            </p>
          )}

          <Button
            type="button"
            className="mt-6 w-full"
            disabled={cart.hasIssues || !!busyId}
            onClick={() => navigate("/checkout")}
          >
            Proceed to checkout
          </Button>
          <Link
            to="/products"
            className="mt-4 block text-center text-[13px] underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

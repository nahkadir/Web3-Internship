import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { describeError, formatPrice } from "../lib/utils";
import ProductImage from "../components/ProductImage";
import QuantityStepper from "../components/QuantityStepper";
import Button from "../components/Button";

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading, error } = useApi(`/products/${id}`);

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setActive(0);
    setQty(1);
    setMessage(null);
  }, [id]);

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-slate-gray">
        Loading...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-center">
        <h1 className="text-[30px] font-bold">Product not found</h1>
        <p className="mt-2 text-slate-gray">
          It may have been removed or is no longer available.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-block font-medium underline"
        >
          Back to the marketplace
        </Link>
      </div>
    );
  }

  const p = data.product;
  const images = p.images ?? [];

  const handleAdd = async () => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }
    setAdding(true);
    setMessage(null);
    try {
      await addItem(p.id, qty);
      setMessage({ type: "ok", text: "Added to your cart." });
    } catch (err) {
      setMessage({ type: "error", text: describeError(err) });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <nav className="text-[13px] text-slate-gray">
        <Link to="/products" className="hover:underline">
          Shop
        </Link>
        {p.category && (
          <>
            {" / "}
            <Link
              to={`/products?category=${p.category.slug}`}
              className="hover:underline"
            >
              {p.category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-midcurrent-navy">{p.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden bg-paper-white">
            <ProductImage
              src={images[active]}
              alt={p.name}
              className="h-full w-full"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-2 flex gap-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={`h-16 w-16 cursor-pointer overflow-hidden border bg-paper-white ${
                    i === active
                      ? "border-midcurrent-navy"
                      : "border-cloud-veil"
                  }`}
                >
                  <ProductImage src={src} alt="" className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {p.category && (
            <p className="text-[11px] font-medium uppercase">
              {p.category.name}
            </p>
          )}
          <h1 className="mt-2 text-[38px] font-bold leading-[1.1]">{p.name}</h1>
          <p className="mt-4 text-[30px] font-bold leading-[1.1]">
            {formatPrice(p.price)}
          </p>

          <p className="mt-3 text-[14px] text-slate-gray">
            {p.stock > 10
              ? `In stock (${p.stock} available)`
              : `Only ${p.stock} left in stock`}
          </p>

          <p className="mt-6 whitespace-pre-line text-[16px] leading-[1.4] text-slate-gray">
            {p.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <QuantityStepper
              value={qty}
              onChange={setQty}
              max={Math.min(p.stock, 100)}
              disabled={adding}
            />
            <Button
              type="button"
              className="min-w-48 flex-1 sm:flex-none"
              loading={adding}
              onClick={handleAdd}
            >
              Add to cart
            </Button>
          </div>

          {message && (
            <p
              role={message.type === "error" ? "alert" : "status"}
              className={`mt-4 text-[13px] ${message.type === "error" ? "text-red-700" : "text-midcurrent-navy"}`}
            >
              {message.text}{" "}
              {message.type === "ok" && (
                <Link to="/cart" className="font-medium underline">
                  View cart
                </Link>
              )}
            </p>
          )}

          <Link
            to={`/vendor/${p.vendor.id}`}
            className="mt-10 flex items-center gap-4 bg-paper-white p-4"
          >
            <ProductImage
              src={p.vendor.logo}
              alt=""
              className="h-12 w-12 shrink-0"
            />
            <div>
              <p className="text-[11px] text-slate-gray">Sold by</p>
              <p className="text-[16px] font-medium">{p.vendor.storeName}</p>
              {p.vendor.storeDescription && (
                <p className="mt-1 line-clamp-2 text-[13px] text-slate-gray">
                  {p.vendor.storeDescription}
                </p>
              )}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

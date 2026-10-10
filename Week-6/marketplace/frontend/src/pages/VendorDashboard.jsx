import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { useApi } from "../hooks/useApi";
import { describeError, formatPrice } from "../lib/utils";
import DashboardHeader from "../components/DashboardHeader";
import StatusBadge from "../components/StatusBadge";
import ProductImage from "../components/ProductImage";
import ProductForm from "../components/ProductForm";
import VendorApplyForm from "../components/VendorApplyForm";
import Pagination from "../components/Pagination";
import Button from "../components/Button";
import VendorEarnings from "../components/VendorEarnings";

const NOTICES = {
  PENDING: {
    title: "Your application is under review",
    text: "An admin will review your store shortly. Until you are approved you cannot create, edit or publish products.",
    border: "border-midcurrent-navy",
  },
  REJECTED: {
    title: "Your application was rejected",
    text: "You cannot publish products. Contact the marketplace admin if you think this is a mistake.",
    border: "border-red-700",
  },
  SUSPENDED: {
    title: "Your store is suspended",
    text: "Your products are hidden from the marketplace and you cannot make changes until an admin reactivates your store.",
    border: "border-red-700",
  },
};

function StockCell({ product, disabled, onSave }) {
  const [value, setValue] = useState(String(product.stock));
  useEffect(() => setValue(String(product.stock)), [product.stock]);
  const dirty = value !== String(product.stock);
  const valid = /^\d+$/.test(value);

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        aria-label={`Stock for ${product.name}`}
        className="h-9 w-20 rounded-[30px] border border-cloud-veil bg-paper-white px-3 text-[14px] outline-none focus:border-soft-stone disabled:opacity-50"
      />
      {dirty && (
        <Button
          type="button"
          size="sm"
          disabled={!valid}
          onClick={() => onSave(Number(value))}
        >
          Save
        </Button>
      )}
    </div>
  );
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const vendorQ = useApi("/vendors/me");
  const vendor = vendorQ.data?.vendor;
  const approved = vendor?.status === "APPROVED";

  const [page, setPage] = useState(1);
  const [view, setView] = useState(null); // null = product list, { product } = form
  const [actionError, setActionError] = useState("");

  const stats = useApi("/vendor/products/stats", { enabled: !!vendor });
  const list = useApi(`/vendor/products?page=${page}&limit=10`, {
    enabled: !!vendor,
  });
  const categories = useApi("/categories");

  const refresh = () => {
    stats.reload();
    list.reload();
  };

  const run = async (fn) => {
    setActionError("");
    try {
      await fn();
      refresh();
    } catch (err) {
      setActionError(describeError(err));
    }
  };

  const saveStock = (p, stock) =>
    run(() =>
      api(`/vendor/products/${p.id}`, { method: "PATCH", body: { stock } }),
    );
  const publish = (p) =>
    run(() =>
      api(`/vendor/products/${p.id}`, {
        method: "PATCH",
        body: { status: "ACTIVE" },
      }),
    );
  const archive = (p) => {
    if (
      window.confirm(
        `Archive "${p.name}"? It will be hidden from the marketplace.`,
      )
    ) {
      run(() => api(`/vendor/products/${p.id}`, { method: "DELETE" }));
    }
  };

  if (vendorQ.loading && !vendorQ.data) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-slate-gray">
        Loading...
      </div>
    );
  }

  // a VENDOR user without a vendor profile yet (e.g. the seeded vendor account)
  if (vendorQ.error?.status === 404) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-12">
        <DashboardHeader
          label="Vendor area"
          title="Vendor Dashboard"
          user={user}
        />
        <section className="mt-10 max-w-xl bg-paper-white p-6">
          <h2 className="text-[26px] font-bold leading-[1.2]">
            Complete your vendor application
          </h2>
          <p className="mt-2 text-[15px] text-slate-gray">
            Tell us about your store to get started.
          </p>
          <div className="mt-6">
            <VendorApplyForm onSubmitted={vendorQ.reload} />
          </div>
        </section>
      </div>
    );
  }

  if (vendorQ.error || !vendor) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-red-700">
        {vendorQ.error?.message || "Could not load your vendor profile"}
      </div>
    );
  }

  const s = stats.data?.stats;
  const notice = NOTICES[vendor.status];
  const cards = [
    [
      "Store",
      <span key="n" className="block truncate">
        {vendor.storeName}
      </span>,
    ],
    ["Status", <StatusBadge key="s" status={vendor.status} />],
    ["Total products", s?.total ?? "–"],
    ["Active", s?.active ?? "–"],
    ["Out of stock", s?.outOfStock ?? "–"],
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12">
      <DashboardHeader
        label="Vendor area"
        title="Vendor Dashboard"
        user={user}
      />

      {notice && (
        <div className={`mt-8 border-l-4 bg-paper-white p-4 ${notice.border}`}>
          <p className="text-[16px] font-bold">{notice.title}</p>
          <p className="mt-1 text-[14px] text-slate-gray">{notice.text}</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="min-w-0 bg-paper-white p-4">
            <p className="text-[12px] text-slate-gray">{label}</p>
            <div className="mt-2 text-[26px] font-bold leading-[1.2]">
              {value}
            </div>
          </div>
        ))}
      </div>

      <VendorEarnings />

      <div className="mt-10">
        {view ? (
          <ProductForm
            product={view.product}
            categories={categories.data?.categories ?? []}
            onCancel={() => setView(null)}
            onSaved={() => {
              setView(null);
              refresh();
            }}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[26px] font-bold leading-[1.2]">
                Your products
              </h2>
              <Button
                type="button"
                disabled={!approved}
                onClick={() => setView({ product: null })}
              >
                Add product
              </Button>
            </div>

            {actionError && (
              <p
                role="alert"
                className="mt-4 rounded-[30px] border border-red-700 px-5 py-2 text-[13px] text-red-700"
              >
                {actionError}
              </p>
            )}

            <div className="mt-4 overflow-x-auto bg-paper-white">
              {list.data?.products.length === 0 ? (
                <p className="px-4 py-12 text-center text-[15px] text-slate-gray">
                  {approved
                    ? "No products yet. Click “Add product” to create your first listing."
                    : "You have no products."}
                </p>
              ) : (
                <table className="w-full min-w-[820px] text-left text-[14px]">
                  <thead className="border-b border-cloud-veil text-[12px] text-slate-gray">
                    <tr>
                      <th className="p-4 font-medium">Product</th>
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium">Price</th>
                      <th className="p-4 font-medium">Stock</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cloud-veil">
                    {(list.data?.products ?? []).map((p) => (
                      <tr key={p.id}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <ProductImage
                              src={p.images?.[0]}
                              alt=""
                              className="h-12 w-12 shrink-0"
                            />
                            <span className="line-clamp-2 max-w-[220px] font-medium">
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-gray">
                          {p.category?.name}
                        </td>
                        <td className="p-4">{formatPrice(p.price)}</td>
                        <td className="p-4">
                          <StockCell
                            product={p}
                            disabled={!approved}
                            onSave={(n) => saveStock(p, n)}
                          />
                        </td>
                        <td className="p-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {p.status === "DRAFT" && (
                              <Button
                                type="button"
                                size="sm"
                                disabled={!approved}
                                onClick={() => publish(p)}
                              >
                                Publish
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={!approved}
                              onClick={() => setView({ product: p })}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={!approved}
                              onClick={() => archive(p)}
                            >
                              Archive
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <Pagination pagination={list.data?.pagination} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

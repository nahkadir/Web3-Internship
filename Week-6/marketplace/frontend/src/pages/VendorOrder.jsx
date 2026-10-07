import { useState } from "react";
import { api } from "../lib/api";
import { useApi } from "../hooks/useApi";
import { describeError, formatDate, formatPrice } from "../lib/utils";
import ProductImage from "../components/ProductImage";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import Button from "../components/Button";

// next steps a vendor can take from each status (mirrors the backend rules)
const ACTIONS = {
  PENDING: [
    ["CONFIRMED", "Confirm order"],
    ["CANCELLED", "Cancel"],
  ],
  CONFIRMED: [
    ["PROCESSING", "Start processing"],
    ["CANCELLED", "Cancel"],
  ],
  PROCESSING: [
    ["SHIPPED", "Mark as shipped"],
    ["CANCELLED", "Cancel"],
  ],
  SHIPPED: [["DELIVERED", "Mark as delivered"]],
};

export default function VendorOrders() {
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");
  const { data, loading, error, reload } = useApi(
    `/vendor/orders?page=${page}&limit=10`,
  );

  const changeStatus = async (order, status, label) => {
    if (
      status === "CANCELLED" &&
      !window.confirm(
        `Cancel your items in ${order.orderNumber}? Stock will be returned.`,
      )
    ) {
      return;
    }
    setBusyId(order.orderId);
    setActionError("");
    try {
      await api(`/vendor/orders/${order.orderId}/status`, {
        method: "PATCH",
        body: { status },
      });
      reload();
    } catch (err) {
      setActionError(describeError(err));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <p className="text-[11px] font-medium uppercase">Vendor area</p>
      <h1 className="mt-2 text-[44px] font-bold leading-[1.1]">Store orders</h1>
      <p className="mt-2 text-[15px] text-slate-gray">
        Only the items from your own store appear here.
      </p>

      {(actionError || error) && (
        <p
          role="alert"
          className="mt-4 rounded-[30px] border border-red-700 px-5 py-2 text-[13px] text-red-700"
        >
          {actionError || error.message}
        </p>
      )}

      {loading && !data ? (
        <p className="mt-8 text-slate-gray">Loading...</p>
      ) : data?.orders.length === 0 ? (
        <div className="mt-8 bg-paper-white px-4 py-16 text-center">
          <h2 className="text-[20px] font-bold">No orders yet</h2>
          <p className="mt-2 text-[15px] text-slate-gray">
            Orders containing your products will show up here.
          </p>
        </div>
      ) : (
        <>
          <div
            className={`mt-8 flex flex-col gap-4 ${loading ? "opacity-60" : ""}`}
          >
            {data?.orders.map((o) => (
              <article key={o.orderId} className="bg-paper-white">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cloud-veil p-4">
                  <div>
                    <p className="text-[16px] font-bold">{o.orderNumber}</p>
                    <p className="text-[12px] text-slate-gray">
                      {formatDate(o.createdAt)} · {o.customer.name}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </header>

                <ul className="divide-y divide-cloud-veil px-4">
                  {o.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 py-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden bg-morning-mist">
                        <ProductImage
                          src={item.productImage}
                          alt={item.productName}
                          className="h-full w-full"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[14px] font-medium">
                          {item.productName}
                        </p>
                        <p className="text-[13px] text-slate-gray">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <p className="text-[14px] font-bold">
                        {formatPrice(item.subtotal)}
                      </p>
                    </li>
                  ))}
                </ul>

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-cloud-veil p-4">
                  <p className="text-[14px]">
                    <span className="text-slate-gray">Your subtotal </span>
                    <strong>{formatPrice(o.subtotal)}</strong>
                  </p>
                  <div className="flex gap-2">
                    {(ACTIONS[o.status] ?? []).map(([status, label], i) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant={i === 0 ? "primary" : "ghost"}
                        disabled={busyId === o.orderId}
                        onClick={() => changeStatus(o, status, label)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </footer>
              </article>
            ))}
          </div>
          <Pagination pagination={data?.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}

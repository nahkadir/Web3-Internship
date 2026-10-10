import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { formatDate, formatPrice } from "../lib/utils";
import ProductImage from "../components/ProductImage";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import Button from "../components/Button";

export default function Orders() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi(
    `/orders?page=${page}&limit=10`,
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <h1 className="text-[44px] font-bold leading-[1.1]">Your orders</h1>

      {error ? (
        <div className="mt-8 bg-paper-white px-4 py-12 text-center">
          <p className="text-[15px] text-red-700">{error.message}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={reload}
          >
            Try again
          </Button>
        </div>
      ) : loading && !data ? (
        <div className="mt-8 flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse bg-paper-white" />
          ))}
        </div>
      ) : data.orders.length === 0 ? (
        <div className="mt-8 bg-paper-white px-4 py-16 text-center">
          <h2 className="text-[20px] font-bold">No orders yet</h2>
          <p className="mt-2 text-[15px] text-slate-gray">
            When you place an order it will show up here.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-block font-medium underline"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <ul
            className={`mt-8 flex flex-col gap-2 ${loading ? "opacity-60" : ""}`}
          >
            {data.orders.map((o) => {
              const needsPayment =
                o.status === "PENDING" &&
                ["UNPAID", "PENDING", "FAILED", "CANCELLED"].includes(
                  o.paymentStatus,
                );
              return (
                <li key={o.id}>
                  <Link
                    to={
                      needsPayment
                        ? `/orders/${o.id}/payment`
                        : `/orders/${o.id}`
                    }
                    className="flex flex-wrap items-center gap-4 bg-paper-white p-4 hover:bg-white/60"
                  >
                    <div className="flex w-[180px] shrink-0 gap-1">
                      {o.previewImages.map((src) => (
                        <ProductImage
                          key={src}
                          src={src}
                          alt=""
                          className="h-14 w-14"
                        />
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-bold">{o.orderNumber}</p>
                      <p className="text-[13px] text-slate-gray">
                        {formatDate(o.createdAt)} · {o.itemCount} item
                        {o.itemCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={o.status} />
                      <StatusBadge status={o.paymentStatus} />
                    </div>
                    <p className="w-28 text-right text-[16px] font-bold">
                      {formatPrice(o.totalAmount)}
                    </p>
                    {needsPayment && (
                      <span className="text-[13px] font-medium underline">
                        Pay now
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Pagination pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}

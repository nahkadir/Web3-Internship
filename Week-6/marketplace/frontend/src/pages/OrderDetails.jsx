import { Link, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { formatDate, formatPrice } from "../lib/utils";
import ProductImage from "../components/ProductImage";
import StatusBadge from "../components/StatusBadge";
import TotalsBlock from "../components/TotalsBlock";

export default function OrderDetails() {
  const { id } = useParams();
  const { data, loading, error } = useApi(`/orders/${id}`);

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
        <h1 className="text-[30px] font-bold">Order not found</h1>
        <Link to="/orders" className="mt-6 inline-block font-medium underline">
          Back to your orders
        </Link>
      </div>
    );
  }

  const o = data.order;
  const needsPayment =
    o.status === "PENDING" &&
    ["UNPAID", "PENDING", "FAILED", "CANCELLED"].includes(o.paymentStatus);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <nav className="text-[13px] text-slate-gray">
        <Link to="/orders" className="hover:underline">
          Orders
        </Link>
        {" / "}
        <span className="text-midcurrent-navy">{o.orderNumber}</span>
      </nav>

      {needsPayment && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-midcurrent-navy bg-paper-white p-4"
        >
          <div>
            <p className="text-[16px] font-bold">Payment required</p>
            <p className="mt-1 text-[14px] text-slate-gray">
              Your order is reserved but not confirmed until it is paid.
            </p>
          </div>
          <Link
            to={`/orders/${id}/payment`}
            className="rounded-[30px] bg-midcurrent-navy px-6 py-3 text-[15px] font-medium text-paper-white"
          >
            Pay now
          </Link>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[38px] font-bold leading-[1.1]">{o.orderNumber}</h1>
        <StatusBadge status={o.status} />
        <StatusBadge status={o.paymentStatus} />
      </div>
      <p className="mt-2 text-[14px] text-slate-gray">
        Placed on {formatDate(o.createdAt)} · Online payment
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          {o.groups.map((group) => (
            <section key={group.vendor.id} className="bg-paper-white">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-cloud-veil p-4">
                <div>
                  <p className="text-[11px] text-slate-gray">Sold by</p>
                  <Link
                    to={`/vendor/${group.vendor.id}`}
                    className="text-[16px] font-medium hover:underline"
                  >
                    {group.vendor.storeName}
                  </Link>
                </div>
                <StatusBadge status={group.status} />
              </header>

              <ul className="divide-y divide-cloud-veil px-4">
                {group.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden bg-morning-mist">
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
              <p className="border-t border-cloud-veil p-4 text-right text-[13px] text-slate-gray">
                Store subtotal {formatPrice(group.subtotal)}
              </p>
            </section>
          ))}
        </div>

        <aside className="h-fit bg-paper-white p-6 lg:sticky lg:top-6">
          <h2 className="text-[20px] font-bold leading-[1.2]">Order total</h2>
          <div className="mt-4">
            <TotalsBlock totals={o} />
          </div>
        </aside>
      </div>
    </div>
  );
}

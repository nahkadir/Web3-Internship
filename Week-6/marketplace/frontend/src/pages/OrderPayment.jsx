import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useApi } from "../hooks/useApi";
import { describeError, formatDateTime, formatPrice } from "../lib/utils";
import ProductImage from "../components/ProductImage";
import StatusBadge from "../components/StatusBadge";
import TotalsBlock from "../components/TotalsBlock";
import ErrorBanner from "../components/ErrorBanner";
import Button from "../components/Button";

const MAX_POLLS = 12;
const TONES = {
  ok: "border-midcurrent-navy",
  bad: "border-red-700",
  neutral: "border-soft-stone",
};

function getView({ payment, order }, returned, timedOut) {
  const status = payment?.status;

  if (status === "PAID" || order.paymentStatus === "PAID") {
    return {
      tone: "ok",
      title: "Payment successful",
      text: "Your payment was verified and your order is confirmed. Each store will now prepare its part of your order.",
    };
  }
  if (order.paymentStatus === "REFUNDED") {
    return {
      tone: "neutral",
      title: "This order was refunded",
      text: "Your payment has been returned to you.",
    };
  }
  if (order.status === "CANCELLED") {
    return {
      tone: "bad",
      title: "This order was cancelled",
      text: "It may have expired because payment wasn't completed in time. Your items have been released.",
    };
  }
  if (
    status === "PROCESSING" ||
    (status === "PENDING" && returned === "success")
  ) {
    return timedOut
      ? {
          tone: "neutral",
          title: "Still confirming your payment",
          text: "The provider hasn't confirmed it yet. Please check again in a moment. You haven't been charged twice.",
        }
      : {
          tone: "neutral",
          title: "Confirming your payment",
          text: "We're waiting for the payment provider to confirm. This usually takes a few seconds.",
          waiting: true,
        };
  }
  if (status === "FAILED") {
    return {
      tone: "bad",
      title: "Payment failed",
      text: `${payment.failureReason || "The payment could not be completed."} Your order is still reserved, so you can try again.`,
    };
  }
  if (status === "CANCELLED") {
    return {
      tone: "bad",
      title: "Payment cancelled",
      text: "The payment was not completed. Your order is still reserved until the deadline below.",
    };
  }
  if (status === "PENDING") {
    return {
      tone: "neutral",
      title: "Payment not completed yet",
      text: "Your order is reserved. Continue to the payment page to finish.",
    };
  }
  return {
    tone: "neutral",
    title: "Complete your payment",
    text: "Your order is placed and reserved. Pay to confirm it.",
  };
}

export default function OrderPayment() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const returned = params.get("result"); // a hint from the redirect only, never proof of payment

  const summary = useApi(`/orders/${id}`);
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [paying, setPaying] = useState(false);
  const [actionError, setActionError] = useState("");
  const [timedOut, setTimedOut] = useState(false);

  // the backend asks the payment provider and tells us the real status
  const check = useCallback(async () => {
    try {
      const data = await api("/payments/verify", {
        method: "POST",
        body: { orderId: id },
      });
      setState({ payment: data.payment, order: data.order });
      setLoadError("");
    } catch (err) {
      setLoadError(describeError(err));
    }
  }, [id]);

  useEffect(() => {
    check();
  }, [check]);

  const status = state?.payment?.status;
  const waiting =
    status === "PROCESSING" || (status === "PENDING" && returned === "success");

  // poll only while the payment is genuinely in flight
  useEffect(() => {
    if (!waiting) return;
    setTimedOut(false);
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      await check();
      if (tries >= MAX_POLLS) {
        clearInterval(timer);
        setTimedOut(true);
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [waiting, check]);

  const startPayment = async () => {
    setPaying(true);
    setActionError("");
    try {
      const data = await api("/payments/create", {
        method: "POST",
        body: { orderId: id },
      });
      window.location.assign(data.redirectUrl); // off to the provider's hosted page
    } catch (err) {
      setActionError(describeError(err));
      setPaying(false);
      check();
    }
  };

  if (loadError && !state) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-center">
        <h1 className="text-[30px] font-bold">Order not found</h1>
        <p className="mt-2 text-slate-gray">{loadError}</p>
        <Link to="/orders" className="mt-6 inline-block font-medium underline">
          Back to your orders
        </Link>
      </div>
    );
  }
  if (!state) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-slate-gray">
        Loading your payment...
      </div>
    );
  }

  const { payment, order } = state;
  const view = getView(state, returned, timedOut);
  const canPay =
    status !== "PAID" &&
    status !== "PROCESSING" &&
    !waiting &&
    order.paymentStatus !== "REFUNDED" &&
    order.status !== "CANCELLED";
  const payLabel = !payment
    ? "Pay now"
    : status === "PENDING"
      ? "Continue to payment"
      : "Try payment again";

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <nav className="text-[13px] text-slate-gray">
        <Link to="/orders" className="hover:underline">
          Orders
        </Link>
        {" / "}
        <Link to={`/orders/${id}`} className="hover:underline">
          {order.orderNumber}
        </Link>
        {" / "}
        <span className="text-midcurrent-navy">Payment</span>
      </nav>

      <h1 className="mt-4 text-[44px] font-bold leading-[1.1]">Payment</h1>

      <div
        role="status"
        className={`mt-6 border-l-4 bg-paper-white p-4 ${TONES[view.tone]}`}
      >
        <p className="text-[18px] font-bold">{view.title}</p>
        <p className="mt-1 text-[14px] text-slate-gray">{view.text}</p>
        {view.waiting && (
          <p className="mt-2 text-[13px] text-slate-gray">Checking...</p>
        )}
        {timedOut && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={check}
          >
            Check again
          </Button>
        )}
      </div>

      <ErrorBanner message={actionError || loadError} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="bg-paper-white">
          <h2 className="border-b border-cloud-veil p-4 text-[16px] font-bold">
            Order summary
          </h2>
          {summary.data ? (
            <>
              {summary.data.order.groups.map((g) => (
                <div
                  key={g.vendor.id}
                  className="border-b border-cloud-veil px-4 py-3"
                >
                  <p className="text-[12px] text-slate-gray">
                    Sold by {g.vendor.storeName}
                  </p>
                  <ul className="mt-2 flex flex-col gap-3">
                    {g.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-3">
                        <ProductImage
                          src={item.productImage}
                          alt=""
                          className="h-12 w-12 shrink-0"
                        />
                        <p className="min-w-0 flex-1 truncate text-[14px]">
                          {item.productName}
                        </p>
                        <p className="text-[13px] text-slate-gray">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                        <p className="w-24 text-right text-[14px] font-bold">
                          {formatPrice(item.subtotal)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="p-4">
                <TotalsBlock totals={summary.data.order} />
              </div>
            </>
          ) : (
            <p className="p-4 text-slate-gray">Loading...</p>
          )}
        </section>

        <aside className="h-fit bg-paper-white p-6 lg:sticky lg:top-6">
          <h2 className="text-[20px] font-bold leading-[1.2]">
            Amount payable
          </h2>
          <p className="mt-2 text-[30px] font-bold leading-[1.1]">
            {formatPrice(order.totalAmount)}
          </p>

          <dl className="mt-4 divide-y divide-cloud-veil text-[14px]">
            <div className="flex items-center justify-between py-2">
              <dt className="text-slate-gray">Payment method</dt>
              <dd>Online (card)</dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-slate-gray">Payment status</dt>
              <dd>
                <StatusBadge status={payment?.status ?? order.paymentStatus} />
              </dd>
            </div>
            {order.paymentStatus !== "PAID" && order.status !== "CANCELLED" && (
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-gray">Pay before</dt>
                <dd>{formatDateTime(order.paymentDeadline)}</dd>
              </div>
            )}
          </dl>

          {canPay && (
            <Button
              type="button"
              className="mt-6 w-full"
              loading={paying}
              onClick={startPayment}
            >
              {payLabel}
            </Button>
          )}
          {status === "PAID" && (
            <Link
              to={`/orders/${id}`}
              className="mt-6 flex w-full items-center justify-center rounded-[30px] bg-midcurrent-navy px-6 py-3 text-[15px] font-medium text-paper-white"
            >
              View order
            </Link>
          )}

          <p className="mt-4 text-[12px] text-slate-gray">
            You'll pay on our payment provider's secure page. Card details are
            never shared with this store, and your order is only confirmed after
            our server verifies the payment.
          </p>
        </aside>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useApi } from "../hooks/useApi";
import { describeError, formatDateTime, formatPrice } from "../lib/utils";
import Button from "../components/Button";
import ErrorBanner from "../components/ErrorBanner";

export default function MockCheckout() {
  const { txnId } = useParams();
  const { data, loading, error } = useApi(`/mock-gateway/${txnId}`);
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");

  const complete = async (outcome) => {
    setBusy(outcome);
    setActionError("");
    try {
      const res = await api(`/mock-gateway/${txnId}/complete`, {
        method: "POST",
        body: { outcome },
      });
      window.location.assign(res.redirectUrl); // back to the shop; the shop will verify, not trust this
    } catch (err) {
      setActionError(describeError(err));
      setBusy("");
    }
  };

  const session = data?.session;
  const active = session?.status === "pending";

  return (
    <div className="mx-auto flex max-w-[1200px] justify-center px-4 py-16">
      <div className="w-full max-w-md bg-paper-white p-8">
        <p className="rounded-[30px] border border-soft-stone px-4 py-1 text-center text-[12px] text-slate-gray">
          Test mode: simulated payment provider. No real money moves and no card
          details are collected.
        </p>

        {loading && !data && (
          <p className="mt-6 text-slate-gray">Loading payment session...</p>
        )}

        {error && (
          <div className="mt-6">
            <h1 className="text-[26px] font-bold leading-[1.2]">
              Payment session not found
            </h1>
            <Link
              to="/orders"
              className="mt-4 inline-block font-medium underline"
            >
              Back to your orders
            </Link>
          </div>
        )}

        {session && (
          <>
            <h1 className="mt-6 text-[26px] font-bold leading-[1.2]">
              Pay {formatPrice(session.amount)}
            </h1>
            <p className="mt-1 text-[14px] text-slate-gray">
              Order {session.orderNumber} · {session.currency}
            </p>

            {active ? (
              <>
                <p className="mt-1 text-[12px] text-slate-gray">
                  Session expires {formatDateTime(session.expiresAt)}
                </p>
                <ErrorBanner message={actionError} />
                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    type="button"
                    loading={busy === "succeed"}
                    disabled={!!busy}
                    onClick={() => complete("succeed")}
                  >
                    Pay with test card
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    loading={busy === "fail"}
                    disabled={!!busy}
                    onClick={() => complete("fail")}
                  >
                    Simulate a declined card
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    loading={busy === "cancel"}
                    disabled={!!busy}
                    onClick={() => complete("cancel")}
                  >
                    Cancel payment
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-6">
                <p className="text-[15px] text-slate-gray">
                  This payment session is no longer active ({session.status}).
                </p>
                <Link
                  to="/orders"
                  className="mt-4 inline-block font-medium underline"
                >
                  Back to your orders
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

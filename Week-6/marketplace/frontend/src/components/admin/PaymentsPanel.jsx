import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import { useDebounce } from "../../hooks/useDebounce";
import { buildQuery, formatDateTime, formatPrice } from "../../lib/utils";
import FormField from "../FormField";
import Select from "../Select";
import StatusBadge from "../StatusBadge";
import Pagination from "../Pagination";
import ErrorBanner from "../ErrorBanner";
import Button from "../Button";
import RefundButton from "./RefundButton";

const STATUSES = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
];

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-slate-gray">{label}</dt>
      <dd className="min-w-0 break-all text-right">{children}</dd>
    </div>
  );
}

function PaymentDetail({ id, onBack }) {
  const { data, loading, error, reload } = useApi(`/admin/payments/${id}`);
  const [actionError, setActionError] = useState("");

  if (loading && !data) return <p className="text-slate-gray">Loading...</p>;
  if (error) return <ErrorBanner message={error.message} />;

  const p = data.payment;

  return (
    <div>
      <Button type="button" variant="ghost" size="sm" onClick={onBack}>
        ← All payments
      </Button>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h2 className="text-[30px] font-bold leading-[1.1]">
          {formatPrice(p.amount)}
        </h2>
        <StatusBadge status={p.status} />
        {p.status === "PAID" && (
          <RefundButton payment={p} onDone={reload} onError={setActionError} />
        )}
      </div>

      <ErrorBanner message={actionError} />

      <dl className="mt-6 max-w-2xl divide-y divide-cloud-veil bg-paper-white px-4 text-[14px]">
        <Row label="Transaction ID">
          <span className="font-mono text-[12px]">
            {p.transactionId ?? "–"}
          </span>
        </Row>
        <Row label="Provider">{p.provider}</Row>
        <Row label="Method">{p.paymentMethod}</Row>
        <Row label="Currency">{p.currency}</Row>
        <Row label="Created">{formatDateTime(p.createdAt)}</Row>
        <Row label="Paid at">{p.paidAt ? formatDateTime(p.paidAt) : "–"}</Row>
        {p.failureReason && <Row label="Failure reason">{p.failureReason}</Row>}
        <Row label="Order">
          {p.order?.orderNumber}{" "}
          <StatusBadge status={p.order?.status ?? "PENDING"} />
        </Row>
        <Row label="Customer">
          {p.customer?.name}
          <br />
          <span className="text-[12px] text-slate-gray">
            {p.customer?.email}
          </span>
        </Row>
        {p.refund?.refundedAt && (
          <>
            <Row label="Refunded">{formatDateTime(p.refund.refundedAt)}</Row>
            <Row label="Refund ID">
              <span className="font-mono text-[12px]">{p.refund.refundId}</span>
            </Row>
            {p.refund.reason && (
              <Row label="Refund reason">{p.refund.reason}</Row>
            )}
          </>
        )}
      </dl>
    </div>
  );
}

export default function PaymentsPanel() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const dSearch = useDebounce(search);
  const badRange = !!from && !!to && from > to;

  const { data, loading, error } = useApi(
    `/admin/payments${buildQuery({ search: dSearch, status, from, to, page, limit: 10 })}`,
    { enabled: !selected && !badRange },
  );

  if (selected)
    return <PaymentDetail id={selected} onBack={() => setSelected(null)} />;

  const reset = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <section>
      <div className="grid gap-3 bg-paper-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField
          id="search"
          label="Transaction ID"
          placeholder="txn_..."
          value={search}
          onChange={reset(setSearch)}
        />
        <Select
          id="status"
          label="Status"
          value={status}
          onChange={reset(setStatus)}
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
        <FormField
          id="from"
          label="From"
          type="date"
          value={from}
          onChange={reset(setFrom)}
        />
        <FormField
          id="to"
          label="To"
          type="date"
          value={to}
          onChange={reset(setTo)}
          error={badRange ? "Start date is after end date" : undefined}
        />
      </div>

      <ErrorBanner message={error?.message} />

      <div
        className={`mt-4 overflow-x-auto bg-paper-white ${loading ? "opacity-60" : ""}`}
      >
        {data?.payments.length === 0 ? (
          <p className="px-4 py-12 text-center text-[15px] text-slate-gray">
            No payments match these filters.
          </p>
        ) : (
          <table className="w-full min-w-[820px] text-left text-[14px]">
            <thead className="border-b border-cloud-veil text-[12px] text-slate-gray">
              <tr>
                <th className="p-4 font-medium">Transaction</th>
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud-veil">
              {(data?.payments ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="max-w-[170px] truncate p-4 font-mono text-[12px]">
                    {p.transactionId ?? "–"}
                  </td>
                  <td className="p-4 font-medium">{p.order?.orderNumber}</td>
                  <td className="p-4">
                    <p>{p.customer?.name}</p>
                    <p className="text-[12px] text-slate-gray">
                      {p.customer?.email}
                    </p>
                  </td>
                  <td className="p-4 font-bold">{formatPrice(p.amount)}</td>
                  <td className="p-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="p-4 text-slate-gray">
                    {formatDateTime(p.createdAt)}
                  </td>
                  <td className="p-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelected(p.id)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination pagination={data?.pagination} onPage={setPage} />
    </section>
  );
}

import { useState } from "react";
import { api } from "../../lib/api";
import { describeError, formatPrice } from "../../lib/utils";
import Button from "../Button";

export default function RefundButton({ payment, onDone, onError }) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    const reason = window.prompt(
      `Refund ${formatPrice(payment.amount)}? This cancels the order and reverses vendor commissions.\n\nOptional reason:`,
      "",
    );
    if (reason === null) return; // cancelled
    setBusy(true);
    try {
      await api(`/admin/payments/${payment.id}/refund`, {
        method: "POST",
        body: { reason: reason.trim() },
      });
      onDone();
    } catch (err) {
      onError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      loading={busy}
      onClick={handle}
    >
      Refund
    </Button>
  );
}

import { useTransactions } from "../../../hooks/useTransactions";
import { useFilteredTransactions } from "../../../hooks/useFilteredTransactions";
import Filters from "../../../Filters/Filters";
import type { Transaction } from "../../../types";
import { useCallback, useState } from "react";
import { useToast } from "../../../context/ToastContext";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import TransactionRow from "./TransactionRow";

interface TransactionListProps {
  onEdit: (transaction: Transaction) => void;
}

const TransactionList = ({ onEdit }: TransactionListProps) => {
  const { lastAddedId } = useTransactions();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDeleteRequest = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const handleEdit = useCallback(
    (t: Transaction) => {
      onEdit(t);
    },
    [onEdit],
  );

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      deleteTransaction(pendingDeleteId);
      showToast("Transaction deleted");
      setPendingDeleteId(null);
    }
  };

  const { deleteTransaction } = useTransactions();
  const filteredTransactions = useFilteredTransactions();

  const escapeCSVField = (value: string | number): string => {
    const stringValue = String(value);
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const handleExportCSV = () => {
    setIsExporting(true);

    setTimeout(() => {
      const headers = [
        "id",
        "type",
        "amount",
        "category",
        "description",
        "date",
      ];
      const rows = filteredTransactions.map((t) => [
        t.id,
        t.type,
        t.amount,
        t.category,
        t.description,
        t.date,
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map(escapeCSVField).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];

      link.href = url;
      link.download = `transactions_${today}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      setIsExporting(false);
      showToast("CSV exported successfully");
    }, 400);
  };

  return (
    <div className="w-full rounded-3xl bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Filters />
        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="sm:text-p text-p-mob bg-dark flex cursor-pointer items-center gap-2 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {isExporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="text-h4-mob sm:text-h4 w-full min-w-2xl text-left">
          <thead>
            <tr>
              <th className="pb-3 font-bold">Date</th>
              <th className="pb-3 font-bold">Description</th>
              <th className="pb-3 font-bold">Category</th>
              <th className="pb-3 text-right font-bold">Amount</th>
              <th className="pb-3 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-16 text-center text-sm text-gray-400"
                >
                  No transactions match your filters
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  isHighlighted={t.id === lastAddedId}
                  onEdit={handleEdit}
                  onDeleteRequest={handleDeleteRequest}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDeleteModal
        isOpen={pendingDeleteId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
};

export default TransactionList;

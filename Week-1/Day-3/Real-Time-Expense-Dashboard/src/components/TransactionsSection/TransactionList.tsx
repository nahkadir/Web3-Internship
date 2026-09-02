import { Pencil, Trash2 } from "lucide-react";
import { useTransactions } from "../../hooks/useTransactions";
import { useFilteredTransactions } from "../../hooks/useFilteredTransactions";
import Filters from "../../Filters/Filters";
import type { Transaction } from "../../types";

interface TransactionListProps {
  onEdit: (transaction: Transaction) => void;
}

const TransactionList = ({ onEdit }: TransactionListProps) => {
  const { deleteTransaction } = useTransactions();
  const filteredTransactions = useFilteredTransactions();

  const handleExportCSV = () => {
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.description,
      t.category,
      t.type,
      t.amount,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full rounded-3xl bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Filters />
        <button
          className="sm:text-p text-p-mob bg-dark flex items-center gap-2 rounded-xl px-4 py-3 font-semibold text-white"
          onClick={handleExportCSV}
        >
          Export CSV
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
                <tr
                  key={t.id}
                  className="border-grey border-t hover:bg-black/10"
                >
                  <td className="py-4 text-gray-500">{t.date}</td>
                  <td className="py-4 text-gray-900">{t.description}</td>
                  <td className="py-4 text-gray-900">{t.category}</td>
                  <td
                    className={`py-4 text-right font-medium ${t.type === "income" ? "text-green-600" : "text-red-500"}`}
                  >
                    {t.type === "income" ? "+" : "−"}Rs{" "}
                    {Math.abs(t.amount).toFixed(2)}
                  </td>
                  <td className="py-4">
                    <div className="flex justify-end gap-7">
                      <button
                        type="button"
                        onClick={() => onEdit(t)}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTransaction(t.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;

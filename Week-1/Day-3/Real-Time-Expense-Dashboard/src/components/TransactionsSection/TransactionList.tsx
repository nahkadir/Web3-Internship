import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTransactions } from "../../hooks/useTransactions";
import type { Transaction, TransactionCategory } from "../../types";

interface TransactionListProps {
  onEdit: (transaction: Transaction) => void;
}

const categories: TransactionCategory[] = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Salary",
  "Other",
];

const TransactionList = ({ onEdit }: TransactionListProps) => {
  const { transactions, deleteTransaction } = useTransactions();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const filteredTransactions = sortedTransactions.filter((t) => {
    const matchesSearch = t.description
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesCategory =
      categoryFilter === "All categories" || t.category === categoryFilter;

    const matchesType =
      typeFilter === "All types" || t.type === typeFilter.toLowerCase();

    const matchesStartDate = !startDate || t.date >= startDate;
    const matchesEndDate = !endDate || t.date <= endDate;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesType &&
      matchesStartDate &&
      matchesEndDate
    );
  });

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
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-grey placeholder:text-p-mob sm:placeholder:text-p min-w-45 flex-1 rounded-xl p-3 outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-xl p-3 text-gray-500 outline-none"
        >
          <option>All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-xl p-3 text-gray-500 outline-none"
        >
          <option>All types</option>
          <option>Income</option>
          <option>Expense</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-xl p-3 text-gray-500 outline-none"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-xl p-3 text-gray-500 outline-none"
        />
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
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="border-grey border-t hover:bg-black/10">
                <td className="py-4 text-gray-500">{t.date}</td>
                <td className="py-4 text-gray-900">{t.description}</td>
                <td className="py-4 text-gray-900">{t.category}</td>
                <td
                  className={`py-4 text-right font-medium ${
                    t.type === "income" ? "text-green-600" : "text-red-500"
                  }`}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;

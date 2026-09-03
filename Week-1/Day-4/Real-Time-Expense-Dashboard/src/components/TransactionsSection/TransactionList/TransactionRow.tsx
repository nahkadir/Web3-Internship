import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Transaction } from "../../../types";

interface TransactionRowProps {
  transaction: Transaction;
  isHighlighted: boolean;
  onEdit: (t: Transaction) => void;
  onDeleteRequest: (id: string) => void;
}

const TransactionRow = memo(
  ({
    transaction: t,
    isHighlighted,
    onEdit,
    onDeleteRequest,
  }: TransactionRowProps) => (
    <tr
      className={`border-grey border-t transition-colors hover:bg-black/10 ${
        isHighlighted ? "bg-green/30" : ""
      }`}
    >
      <td className="py-4 text-gray-500">{t.date}</td>

      <td className="py-4 text-gray-900">{t.description}</td>

      <td className="py-4 text-gray-900">{t.category}</td>

      <td
        className={`py-4 text-right font-medium ${
          t.type === "income" ? "text-green-600" : "text-red-500"
        }`}
      >
        {t.type === "income" ? "+" : "−"}Rs {Math.abs(t.amount).toFixed(2)}
      </td>

      <td className="py-4">
        <div className="flex justify-end gap-7">
          <button
            type="button"
            onClick={() => onEdit(t)}
            className="cursor-pointer text-gray-400 hover:text-gray-700"
          >
            <Pencil size={20} />
          </button>

          <button
            type="button"
            onClick={() => onDeleteRequest(t.id)}
            className="cursor-pointer text-gray-400 hover:text-red-500"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </td>
    </tr>
  ),
);

export default TransactionRow;

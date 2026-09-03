import { useEffect, useState } from "react";
import { useTransactions } from "../../hooks/useTransactions";
import { useToast } from "../../context/ToastContext";
import type {
  Transaction,
  TransactionType,
  TransactionCategory,
} from "../../types";
import { generateId } from "../../utils/helpers";

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

const today = new Date().toISOString().split("T")[0];

interface FormErrors {
  amount?: string;
  category?: string;
  description?: string;
}

interface AddEntryBarProps {
  editingTransaction: Transaction | null;
  onDoneEditing: () => void;
}

const AddEntryBar = ({
  editingTransaction,
  onDoneEditing,
}: AddEntryBarProps) => {
  const { showToast } = useToast();
  const { addTransaction, updateTransaction } = useTransactions();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [errors, setErrors] = useState<FormErrors>({});

  const isEditing = editingTransaction !== null;

  // Pre-fill form when a transaction is selected for editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setDate(editingTransaction.date);
      setErrors({});
    }
  }, [editingTransaction]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const numericAmount = Number(amount);

    if (!amount || numericAmount <= 0) {
      newErrors.amount = "Amount must be positive";
    }
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setType("expense");
    setAmount("");
    setCategory("Food");
    setDescription("");
    setDate(today);
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (isEditing && editingTransaction) {
      const updated: Transaction = {
        ...editingTransaction,
        type,
        amount: Number(amount),
        category,
        description: description.trim(),
        date,
      };
      updateTransaction(editingTransaction.id, updated);
      showToast("Transaction updated");
      onDoneEditing();
    } else {
      const newTransaction: Transaction = {
        id: generateId(),
        type,
        amount: Number(amount),
        category,
        description: description.trim(),
        date,
      };
      addTransaction(newTransaction);
      showToast("Transaction added");
    }

    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onDoneEditing();
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-wrap items-start gap-3 p-4">
      <div className="flex min-w-35 flex-1 flex-col gap-1">
        <label htmlFor="description" className="sr-only">
          Description
        </label>
        <input
          id="description"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-grey placeholder:text-p-mob sm:placeholder:text-p w-full rounded-md border border-black/10 p-3 outline-none"
        />
        {errors.description && (
          <span className="text-xs text-red-500">{errors.description}</span>
        )}
      </div>

      <div className="flex w-24 flex-col gap-1">
        <label htmlFor="amount" className="sr-only">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-grey placeholder:text-p-mob sm:placeholder:text-p w-full rounded-md border border-black/10 p-3 outline-none"
        />
        {errors.amount && (
          <span className="text-xs text-red-500">{errors.amount}</span>
        )}
      </div>

      <label htmlFor="category" className="sr-only">
        category
      </label>
      <select
        id="category"
        value={category}
        onChange={(e) => setCategory(e.target.value as TransactionCategory)}
        className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-md border border-black/10 p-3 text-gray-700 outline-none"
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <label htmlFor="date" className="sr-only">
        date
      </label>
      <input
        id="date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-grey placeholder:text-p-mob sm:placeholder:text-p rounded-md border border-black/10 p-3 text-gray-700 outline-none"
      />

      <div className="bg-grey flex gap-0.5 rounded-md border border-black/10 p-1.5">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`cursor-pointer rounded-md px-3 py-2 text-sm font-bold ${
            type === "expense" ? "bg-green text-dark" : "text-gray-400"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`cursor-pointer rounded-md px-3 py-2 text-sm font-bold ${
            type === "income" ? "bg-green text-dark" : "text-gray-400"
          }`}
        >
          Income
        </button>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="bg-dark text-p-mob sm:text-p cursor-pointer rounded-md px-5 py-3 font-semibold text-white"
      >
        {isEditing ? "Update Transaction" : "Add Transaction"}
      </button>

      {isEditing && (
        <button
          type="button"
          onClick={handleCancel}
          className="text-p-mob sm:text-p cursor-pointer rounded-md border border-black/10 px-5 py-3 font-semibold text-gray-600"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default AddEntryBar;

import { useEffect, useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useToast } from "../context/ToastContext";
import { generateRandomTransaction } from "../utils/transactionSimulator";

const LiveSimulator = () => {
  const [isLive, setIsLive] = useState(false);
  const { addTransaction } = useTransactions();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLive) return;

    const intervalId = setInterval(() => {
      const newTransaction = generateRandomTransaction();
      addTransaction(newTransaction);
      showToast(`New transaction: ${newTransaction.description}`);
    }, 20000);

    return () => clearInterval(intervalId);
  }, [isLive]);

  return (
    <button
      type="button"
      onClick={() => setIsLive((prev) => !prev)}
      className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
        isLive ? "bg-green text-dark" : "bg-dark-default text-gray-400"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${isLive ? "bg-dark animate-pulse" : "bg-gray-500"}`}
      />
      {isLive ? "Live" : "Go live"}
    </button>
  );
};

export default LiveSimulator;

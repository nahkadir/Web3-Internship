import { useContext } from "react";
import { TransactionContext } from "../context/TransactionContext";
export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error(
      "useTransactions must be used within a TransactionProvider",
    );
  }

  const incomeTransactions = context.transactions.filter(
    (t) => t.type === "income",
  );
  const expenseTransactions = context.transactions.filter(
    (t) => t.type === "expense",
  );

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );
  const netBalance = totalIncome - totalExpense;

  return {
    ...context,
    totalIncome,
    totalExpense,
    netBalance,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length,
  };
}

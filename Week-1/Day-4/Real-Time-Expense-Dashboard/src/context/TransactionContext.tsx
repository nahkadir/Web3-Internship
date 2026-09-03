import { createContext, useState, useEffect, type ReactNode } from "react";
import type { Transaction } from "../types";
import sampleTransactions from "../data/sampleTransactions";

const STORAGE_KEY = "transactions";

// what our context contains
export interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updated: Transaction) => void;
  lastAddedId: string | null;
}

// create a context where the initial value is undefined
// generic: will either contain a TransactionContextType OR undefined.
export const TransactionContext = createContext<
  TransactionContextType | undefined
>(undefined);

// load transactions from localStorage on mount; fall back to sample data
// if nothing is stored or the stored data is invalid
function loadInitialTransactions(): Transaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to load transactions from localStorage:", error);
  }
  return sampleTransactions;
}

// children can be any valid React content
// since we are wrapping TransactionProvider around App hence App is the children
export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(
    loadInitialTransactions,
  );
  // transactions are an array of Transaction type

  // sync transactions to localStorage whenever they change
  // (covers add/edit/delete since they all go through setTransactions)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error("Failed to save transactions to localStorage:", error);
    }
  }, [transactions]);

  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev]);
    setLastAddedId(transaction.id);
    setTimeout(() => setLastAddedId(null), 2000);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTransaction = (id: string, updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        lastAddedId,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

import { useState } from "react";
import AddEntryBar from "./AddEntryBar";
import TransactionList from "./TransactionList/TransactionList";
import type { Transaction } from "../../types";

const TransactionsSection = () => {
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  return (
    <div className="px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <AddEntryBar
          editingTransaction={editingTransaction}
          onDoneEditing={() => setEditingTransaction(null)}
        />
        <div className="mt-4">
          <TransactionList onEdit={setEditingTransaction} />
        </div>
      </div>
    </div>
  );
};

export default TransactionsSection;

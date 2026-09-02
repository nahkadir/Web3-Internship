import SummaryCard from "./SummaryCard";
import { useFilteredTransactions } from "../../hooks/useFilteredTransactions";
import { calculateTotals } from "../../utils/helpers";
import { formatCurrency } from "../../utils/helpers";

const SummaryCards = () => {
  const filteredTransactions = useFilteredTransactions();
  const { totalIncome, totalExpense, netBalance } =
    calculateTotals(filteredTransactions);

  const incomeCount = filteredTransactions.filter(
    (t) => t.type === "income",
  ).length;
  const expenseCount = filteredTransactions.filter(
    (t) => t.type === "expense",
  ).length;

  return (
    <div className="px-4 pt-10 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        <SummaryCard
          label="Balance"
          value={formatCurrency(netBalance)}
          status={netBalance >= 0 ? "Positive" : "Negative"}
        />
        <SummaryCard
          label="Income"
          value={formatCurrency(totalIncome)}
          status={`${incomeCount} ${incomeCount === 1 ? "entry" : "entries"}`}
        />
        <SummaryCard
          label="Expenses"
          value={formatCurrency(totalExpense)}
          status={`${expenseCount} ${expenseCount === 1 ? "entry" : "entries"}`}
        />
      </div>
    </div>
  );
};

export default SummaryCards;

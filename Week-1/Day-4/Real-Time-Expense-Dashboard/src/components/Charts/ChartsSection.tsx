import CategoryBreakdown from "./CategoryBreakdown";
import IncomeExpenseTrend from "./IncomeExpenseTrend";
import BalanceTrend from "./BalanceTrend";
import { useFilteredTransactions } from "../../hooks/useFilteredTransactions";

const ChartsSection = () => {
  const filteredTransactions = useFilteredTransactions();

  return (
    <div className="px-4 sm:px-6">
      <div className="mx-auto mt-4 grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-2">
        <IncomeExpenseTrend transactions={filteredTransactions} />
        <CategoryBreakdown transactions={filteredTransactions} />
        <BalanceTrend transactions={filteredTransactions} />
      </div>
    </div>
  );
};

export default ChartsSection;

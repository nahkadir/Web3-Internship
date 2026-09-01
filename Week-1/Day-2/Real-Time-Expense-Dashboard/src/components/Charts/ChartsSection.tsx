import CategoryBreakdown from "./CategoryBreakdown";
import IncomeExpenseTrend from "./IncomeExpenseTrend";

const ChartsSection = () => {
  return (
    <div className="px-4 sm:px-6">
      <div className="mx-auto mt-4 grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-2">
        <IncomeExpenseTrend />
        <CategoryBreakdown />
      </div>
    </div>
  );
};

export default ChartsSection;

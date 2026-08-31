import SummaryCard from "./SummaryCard";

const summaryData = [
  { label: "Balance", value: "Rs 4,320.50", status: "Positive" },
  { label: "Income", value: "Rs 7,500.00", status: "2 entires" },
  { label: "Expenses", value: "Rs 3,179.50", status: "3 entries" },
  { label: "Savings", value: "Rs 1,200.00", status: "5 total" },
];

const SummaryCards = () => {
  return (
    <div className="px-4 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
        {summaryData.map((item) => (
          <SummaryCard
            key={item.label}
            label={item.label}
            value={item.value}
            status={item.status}
          />
        ))}
      </div>
    </div>
  );
};

export default SummaryCards;

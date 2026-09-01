// components/Charts/IncomeExpenseTrend.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useTransactions } from "../../hooks/useTransactions";

const IncomeExpenseTrend = () => {
  const { transactions } = useTransactions();

  const totalsByMonth = transactions.reduce<
    Record<string, { income: number; expense: number }>
  >((acc, t) => {
    const month = t.date.slice(0, 7); // "2026-08-31" -> "2026-08"
    if (!acc[month]) acc[month] = { income: 0, expense: 0 };
    acc[month][t.type] += t.amount;
    return acc;
  }, {});

  const chartData = Object.entries(totalsByMonth)
    .map(([month, totals]) => ({ month, ...totals }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="rounded-3xl bg-white p-6">
      <h3 className="text-dark mb-4 text-lg font-bold">Income vs. expenses</h3>
      {chartData.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">
          No transactions yet
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F3F3"
              vertical={false}
            />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `Rs ${Number(value).toFixed(2)}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="income"
              name="Income"
              fill="#B9FF66"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="expense"
              name="Expense"
              fill="#E14A4A"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default IncomeExpenseTrend;

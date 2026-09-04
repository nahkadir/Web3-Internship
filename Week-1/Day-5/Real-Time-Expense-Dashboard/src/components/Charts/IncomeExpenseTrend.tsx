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
import type { Transaction } from "../../types";
import { groupByMonth } from "../../utils/chartUtils";
import { useMemo } from "react";

interface IncomeExpenseTrendProps {
  transactions: Transaction[];
}

const IncomeExpenseTrend = ({ transactions }: IncomeExpenseTrendProps) => {
  const chartData = useMemo(() => groupByMonth(transactions), [transactions]);
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

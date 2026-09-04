import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { calculateCumulativeBalance } from "../../utils/chartUtils";
import type { Transaction } from "../../types";
import { useMemo } from "react";

interface BalanceTrendProps {
  transactions: Transaction[];
}

const BalanceTrend = ({ transactions }: BalanceTrendProps) => {
  const chartData = useMemo(
    () => calculateCumulativeBalance(transactions),
    [transactions],
  );

  return (
    <div className="rounded-3xl bg-white p-6">
      <h3 className="text-dark mb-4 text-lg font-bold">Balance trend</h3>
      {chartData.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">
          No data for selected filters
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F3F3"
              vertical={false}
            />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `Rs ${Number(value).toFixed(2)}`} />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#191A23"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default BalanceTrend;

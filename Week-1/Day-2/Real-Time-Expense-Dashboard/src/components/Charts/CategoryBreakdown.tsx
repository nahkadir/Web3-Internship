// components/Charts/CategoryBreakdown.tsx
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTransactions } from "../../hooks/useTransactions";

const COLORS = [
  "#B9FF66",
  "#191A23",
  "#4C9A2A",
  "#E14A4A",
  "#9A9DAE",
  "#292A32",
  "#7FBF3F",
  "#D0D0D0",
  "#5C6270",
];

const CategoryBreakdown = () => {
  const { transactions } = useTransactions();

  const totalsByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const chartData = Object.entries(totalsByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-3xl bg-white p-6">
      <h3 className="text-dark mb-4 text-lg font-bold">Spend by category</h3>
      {chartData.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">
          No expenses yet
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `Rs ${Number(value).toFixed(2)}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CategoryBreakdown;

import type { Transaction } from "../types";

export function groupByCategory(transactions: Transaction[]) {
  const totals = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function groupByMonth(transactions: Transaction[]) {
  const totals = transactions.reduce<
    Record<string, { income: number; expense: number }>
  >((acc, t) => {
    const month = t.date.slice(0, 7);
    if (!acc[month]) acc[month] = { income: 0, expense: 0 };
    acc[month][t.type] += t.amount;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([month, totals]) => ({ month, ...totals }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function calculateCumulativeBalance(transactions: Transaction[]) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let runningBalance = 0;
  return sorted.map((t) => {
    runningBalance += t.type === "income" ? t.amount : -t.amount;
    return { date: t.date, balance: runningBalance };
  });
}

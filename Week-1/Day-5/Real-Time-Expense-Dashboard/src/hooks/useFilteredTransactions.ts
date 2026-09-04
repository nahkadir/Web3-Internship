import { useMemo } from "react";
import { useTransactions } from "./useTransactions";
import { useFilters } from "../context/FilterContext";

export function useFilteredTransactions() {
  const { transactions } = useTransactions();
  const { filters } = useFilters();

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch = t.description
          .toLowerCase()
          .includes(filters.search.trim().toLowerCase());
        const matchesCategory =
          filters.category === "All categories" ||
          t.category === filters.category;
        const matchesType =
          filters.type === "All types" || t.type === filters.type.toLowerCase();
        const matchesStartDate =
          !filters.startDate || t.date >= filters.startDate;
        const matchesEndDate = !filters.endDate || t.date <= filters.endDate;
        const matchesMin =
          !filters.minAmount || t.amount >= Number(filters.minAmount);
        const matchesMax =
          !filters.maxAmount || t.amount <= Number(filters.maxAmount);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesType &&
          matchesStartDate &&
          matchesEndDate &&
          matchesMin &&
          matchesMax
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filters]);

  return filteredTransactions;
}

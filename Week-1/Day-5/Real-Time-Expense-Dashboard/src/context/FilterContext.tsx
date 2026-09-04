import { createContext, useContext, useState, type ReactNode } from "react";

interface FilterState {
  search: string;
  category: string;
  type: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
}

const defaultFilters: FilterState = {
  search: "",
  category: "All categories",
  type: "All types",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
};

interface FilterContextType {
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: string) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const setFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}

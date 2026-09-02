# Day 3 — Filters & Charts

## State management approach

- **`FilterContext`** — separate from `TransactionContext`, holds all filter values (search, category, type, date range, min/max amount) plus `setFilter(key, value)` and `resetFilters()`. Kept separate since filter state changes at a different frequency (every keystroke) and for a different reason than transaction data (add/edit/delete).
- **`useFilteredTransactions()`** — combines `useTransactions` + `useFilters`, returns one filtered + sorted array, memoized with `useMemo` so it only recomputes when transactions or filters actually change. Filtering is a derived value, not duplicated state.
- Filtered data flows into `TransactionList`, `SummaryCards`, and all three charts via this one hook — each chart component receives `transactions` as a prop rather than reading context directly, keeping them purely presentational.

## Chart library usage

Three Recharts charts, transformation logic separated into `utils/chartHelpers.ts` (`groupByCategory`, `groupByMonth`, `calculateCumulativeBalance`) — chart components just call these and render:

- **`IncomeExpenseTrend`** — grouped bar chart, monthly income vs. expense totals. Bar over line since each point is a discrete monthly total, not a continuous flow.
- **`CategoryBreakdown`** — donut chart, expense-only spend by category. Donut for part-to-whole readability at up to 9 categories.
- **`BalanceTrend`** — line chart, cumulative net balance over time. Line fits here since it's a genuinely continuous running total.

All three show "No data for selected filters" when a filter produces zero results.

## What was built

- `FilterContext` + `Filters` component (search, category, type, date range, min/max amount, Clear Filters)
- `useFilteredTransactions` hook
- `TransactionList`, `SummaryCards`, and all charts wired to filtered data
- `calculateTotals` helper (shared between `useTransactions` and `SummaryCards`)
- `utils/chartHelpers.ts` with the 3 transformation functions above
- `BalanceTrend` chart added

**Deliverables:** ✅ All complete — filters functional, List/Cards/Charts filter-aware, 3 chart types implemented, transformation logic in `utils/`, empty states handled.

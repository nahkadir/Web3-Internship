# Real-Time Expense Dashboard

A React + TypeScript dashboard for tracking income and expenses — summary cards, a transaction form, a filterable transaction table, and category charts.

## Tech stack

- **React + TypeScript** — component structure and type safety
- **Vite** — build tool / dev server
- **Tailwind CSS** — styling
- **Recharts** — data visualization
- **Lucide React** — icons

## Why Recharts

- The project is already a React app, so Recharts avoids the extra wrapper-library friction that comes with canvas-based libraries like Chart.js.
- It has a declarative API, which keeps chart updates clean as the underlying transaction state changes in real time.
- This dashboard isn't plotting large datasets (tens of thousands of points) where canvas-level rendering performance would matter — Recharts' SVG approach is fast enough for typical expense/income data.
- Styling stays consistent with the rest of the UI, since colors, dark mode, and theming flow through props/CSS instead of a separate canvas theme system.

## Project structure

```
src/
├── components/
│   ├── SummaryCards/
│   ├── TransactionForm/
│   ├── TransactionList/
│   ├── Filters/
│   └── Charts/
├── context/
├── hooks/
├── utils/
├── data/
├── App.tsx
└── main.tsx
```

## Transaction data model

Defined in `types.ts`:

```typescript
export type TransactionType = "income" | "expense";

export type TransactionCategory =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Bills"
  | "Entertainment"
  | "Healthcare"
  | "Education"
  | "Salary"
  | "Other";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string;
}
```

Sample data (`data/`) includes a mix of income and expense transactions across all nine categories, with varying dates and amounts, used to populate the dashboard during development.

## Setup

```bash
npm install
npm run dev
```

## Progress log

### Day 1

- **Commit:** [`40ef423`](https://github.com/nahkadir/Real-Time-Expense-Dashboard/commit/40ef423cbc001e2328664734adb292a62d8589ec) — first commit
- **Commit:** [`7776ee1`](https://github.com/nahkadir/Real-Time-Expense-Dashboard/commit/7776ee138c6a1e19967a34b45e041ea6d3b5d55f) — installed Lucide icons and Recharts; created the `Header` component and a reusable `Subheading` component; created `types.ts` with `Transaction`, `TransactionType`, and `TransactionCategory`
- **Commit:** [`c4a649e`](https://github.com/nahkadir/Real-Time-Expense-Dashboard/commit/c4a649e032492ca41f77c03a71cb4bc21dfd6b2b) — built reusable `SummaryCards`, added the transaction entry form and transaction table, added sample transaction data, added the `Footer`

**Deliverables completed:**

- [x] React application running (Vite + TypeScript)
- [x] Dashboard layout created (header, summary cards, transaction form, transaction list, footer)
- [x] Transaction data model defined
- [x] Sample transaction data available
- [x] Chart library installed (Recharts)
- [x] Project structure organized
- [x] README with project requirements and setup instructions

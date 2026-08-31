# Real-Time Expense Dashboard

A React + TypeScript dashboard for tracking income and expenses — summary cards, a transaction form, a filterable transaction table. Category charts are to be added next after Transactions section.

## Tech stack

- **React + TypeScript** — component structure and type safety
- **Vite** — build tool / dev server
- **Tailwind CSS** — styling
- **Recharts** — data visualization
- **Lucide React** — icons

## Why Recharts

- The project is already a React app, so Recharts avoids the extra wrapper-library friction that comes with canvas-based libraries like Chart.js.
- It has a declarative API, which keeps chart updates clean as the underlying transaction state changes in real time.
- This dashboard isn't plotting large datasets (tens of thousands of points) where canvas-level rendering performance would matter. Recharts' SVG approach is fast enough for typical expense/income data.
- Styling stays consistent with the rest of the UI, since colors, dark mode, and theming flow through props/CSS instead of a separate canvas theme system.

## Project structure

```
src/
├── components/
│   ├── SummaryCards/
│   ├── TransactionsSection/
├── Footer.tsx
├── Header.tsx
├── Subheading.tsx
├── data/
├── App.tsx
└── main.tsx
└── types.ts
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

Sample data (`data/sampleTransactions.ts`) includes a mix of income and expense transactions across all nine categories, with varying dates and amounts, used to populate the dashboard during development.

## Setup

```bash
npm install
npm run dev
```

**Deliverables completed:**

- [x] React application running (Vite + TypeScript)
- [x] Dashboard layout created (header, summary cards, transaction form, transaction list, footer)
- [x] Transaction data model defined
- [x] Sample transaction data available
- [x] Chart library installed (Recharts)
- [x] Project structure organized
- [x] README with project requirements and setup instructions

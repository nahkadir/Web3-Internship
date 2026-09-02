# Real-Time Expense Dashboard — Day 2

A React + TypeScript dashboard for tracking income and expenses. This folder builds on Day 1 (layout, data model, sample data) by making transactions fully functional: add, edit, delete, persist and filter.

## Setup

```bash
npm install
npm run dev
```

## Project structure

```
src/
├── components/
│   ├── Charts/
        └── CategoryBreakdown.tsx
        └── ChartsSection.tsx
        └── IncomeExpenseTrend.tsx
│   ├── SummaryCard/
        └── SummaryCard.tsx
        └── SummaryCards.tsx
│   ├── TransactionsSection/
        └── AddEntryBar.tsx
        └── TransactionList.tsx
        └── TransactionsSection.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   └── Subheading.tsx
├── context/
│   └── TransactionContext.tsx
├── data/
│   └── sampleTransactions.ts
├── hooks/
│   └── useTransactions.ts
├── utils/
│   └── helpers.ts
├── App.tsx
├── main.tsx
└── types.ts
```

## Transaction Management & State Logic

### Global state management

All transaction state lives in `TransactionContext` (`context/TransactionContext.tsx`), created with React's Context API and exposed via a `TransactionProvider` that wraps the app in `main.tsx`. It's initialized from the Day 1 sample data.

The context holds one array, `transactions`, plus three actions that all funnel through the same `setTransactions` call:

- `addTransaction(transaction)` — prepends a new transaction
- `deleteTransaction(id)` — removes a transaction by id
- `updateTransaction(id, updated)` — replaces a transaction by id (used by the Edit flow)

No transaction data is kept in local component state — `TransactionList` and `AddEntryBar` both read from and write to the context via the `useTransactions` hook, so the two stay in sync automatically. `AddEntryBar` also accepts an `editingTransaction` (lifted into the shared parent, `TransactionsSection`) to know whether it's creating a new transaction or updating an existing one, and switches between calling `addTransaction` or `updateTransaction` accordingly.

### Transaction form — functional

`AddEntryBar` now has real inputs: type toggle, numeric amount, category dropdown, description text, and a date picker defaulting to today. On submit it generates a unique id via `generateId()` (`utils/helpers.ts`), calls `addTransaction` (or `updateTransaction` when editing), and resets the form. Validation covers positive amount and required description, with inline error messages.

### Transaction list — functional

`TransactionList` renders all transactions from context, color-coded by type (green income / red expense), sorted by date with the most recent first. Each row has:

- **Delete** — wired to `deleteTransaction`
- **Edit** — pre-fills the form with that transaction's data and calls `updateTransaction` on submit instead of `addTransaction`

### Persistence strategy

Transactions persist to `localStorage` under the key `"transactions"`, handled entirely inside `TransactionContext.tsx`:

- **Load:** on initial mount, `useState` is given a lazy initializer function that reads from `localStorage`, parses it, and falls back to `sampleTransactions` if the key is missing, invalid JSON, or not an array.
- **Save:** a single `useEffect` watches the `transactions` array and writes it to `localStorage` whenever it changes. Because every action goes through `setTransactions`, this one effect covers all add/edit/delete without per-action sync logic.
- Both the read and write are wrapped in `try/catch` so a corrupted value or unavailable storage (e.g. private browsing) doesn't crash the app — it just falls back to sample data.

### Custom hook

`hooks/useTransactions.ts` wraps the raw context and derives:

- `totalIncome`
- `totalExpense`
- `netBalance`
- `incomeCount` / `expenseCount`

These are recalculated on every render from the current `transactions` array, powering the Summary Cards with real, calculated numbers instead of placeholders.

### Utils

`utils/helpers.ts` currently provides id generation (`generateId`). Currency and date formatting helpers are still to be added as the Summary Cards / Charts get styled.

### Filtering & export (bonus, beyond the Day 2 spec)

`TransactionList` also supports filtering by description (search), category, type, and date range, combined with AND logic. The same filtered array powers both the on-screen table and the "Export CSV" button, so the exported file always matches what's currently visible.

## Deliverables completed — Day 2

- [x] Global state managed via `TransactionContext` (Context API), initialized from Day 1 sample data
- [x] `TransactionForm` fully functional with inline validation
- [x] Unique id generation on submit
- [x] Transaction list renders from context, color-coded by type
- [x] Delete action wired to `deleteTransaction`
- [x] Edit action pre-fills the form and calls `updateTransaction`
- [x] Transactions sorted by date, most recent first, by default
- [x] Data persists to `localStorage`; loads on mount with sample-data fallback; syncs on every add/edit/delete
- [x] `useTransactions` custom hook exposes `totalIncome`, `totalExpense`, `netBalance`
- [x] Summary Cards powered by real calculated totals
- [x] `utils/` helpers in place for id generation (currency/date formatting pending)
- [x] Filtering (search, category, type, date range) and CSV export, kept in sync
- [x] README updated with state management and persistence notes

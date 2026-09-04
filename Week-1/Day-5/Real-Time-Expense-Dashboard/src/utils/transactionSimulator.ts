import type {
  Transaction,
  TransactionType,
  TransactionCategory,
} from "../types";
import { generateId } from "./helpers";

const categories: TransactionCategory[] = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Salary",
  "Other",
];

const categoryDescriptions: Record<TransactionCategory, string[]> = {
  Food: ["Quick snack", "Grocery run", "Restaurant dinner", "Coffee run"],
  Transport: ["Ride fare", "Fuel top-up", "Bus pass", "Parking fee"],
  Shopping: [
    "Online order",
    "New clothes",
    "Electronics purchase",
    "Home essentials",
  ],
  Bills: ["Utility bill", "Internet bill", "Phone bill", "Rent payment"],
  Entertainment: [
    "Movie ticket",
    "Concert ticket",
    "Streaming subscription",
    "Game purchase",
  ],
  Healthcare: [
    "Pharmacy visit",
    "Doctor consultation",
    "Lab test",
    "Health checkup",
  ],
  Education: ["Course fee", "Book purchase", "Workshop fee", "Tuition payment"],
  Salary: ["Monthly salary", "Bonus payment", "Freelance payment"],
  Other: ["Miscellaneous expense", "Gift", "Sold old item", "Cashback reward"],
};

const categoryAmountRanges: Record<TransactionCategory, [number, number]> = {
  Food: [100, 1500],
  Transport: [50, 800],
  Shopping: [300, 5000],
  Bills: [500, 4000],
  Entertainment: [200, 2000],
  Healthcare: [300, 3000],
  Education: [500, 6000],
  Salary: [30000, 80000],
  Other: [100, 2000],
};

export function generateRandomTransaction(): Transaction {
  const type: TransactionType = Math.random() > 0.85 ? "income" : "expense";

  const incomeCategories: TransactionCategory[] = ["Salary", "Other"];
  const expenseCategories: TransactionCategory[] = categories.filter(
    (c) => c !== "Salary",
  );
  const relevantCategories =
    type === "income" ? incomeCategories : expenseCategories;

  const category =
    relevantCategories[Math.floor(Math.random() * relevantCategories.length)];
  const [min, max] = categoryAmountRanges[category];
  const amount = Math.floor(Math.random() * (max - min)) + min;

  const possibleDescriptions = categoryDescriptions[category];
  const description =
    possibleDescriptions[
      Math.floor(Math.random() * possibleDescriptions.length)
    ];

  return {
    id: generateId(),
    type,
    amount,
    category,
    description,
    date: new Date().toISOString().split("T")[0],
  };
}

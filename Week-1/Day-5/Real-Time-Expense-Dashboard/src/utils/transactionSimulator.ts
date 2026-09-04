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

const descriptions = [
  "Quick snack",
  "Ride fare",
  "Online order",
  "Utility bill",
  "Movie ticket",
  "Pharmacy visit",
  "Course fee",
  "Bonus payment",
];

export function generateRandomTransaction(): Transaction {
  const type: TransactionType = Math.random() > 0.7 ? "income" : "expense";
  const category = categories[Math.floor(Math.random() * categories.length)];
  const description =
    descriptions[Math.floor(Math.random() * descriptions.length)];
  const amount = Math.floor(Math.random() * 5000) + 50;

  return {
    id: generateId(),
    type,
    amount,
    category,
    description,
    date: new Date().toISOString().split("T")[0],
  };
}

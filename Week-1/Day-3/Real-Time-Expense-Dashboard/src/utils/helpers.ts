export function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}

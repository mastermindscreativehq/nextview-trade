import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions — NEXTVIEW TRADE",
};

export default function TransactionsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">Transactions</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Activity history for your paper account.
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-text-muted">Transaction history landing in Phase 5.</p>
      </div>
    </div>
  );
}
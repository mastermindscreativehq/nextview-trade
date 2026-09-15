import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders — NEXTVIEW TRADE",
};

export default function OrdersPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">Orders</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Open, filled, cancelled, and rejected orders.
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-text-muted">Order history landing in Phase 4.</p>
      </div>
    </div>
  );
}
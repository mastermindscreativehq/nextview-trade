import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — NEXTVIEW TRADE",
};

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Your trading terminal overview. Portfolio summary and market activity will appear here.
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-text-muted">Dashboard widgets are coming in Phase 5.</p>
      </div>
    </div>
  );
}
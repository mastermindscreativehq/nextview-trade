import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Positions — NEXTVIEW TRADE",
};

export default function PositionsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">Positions</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Your open positions and unrealized P&L.
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-text-muted">Positions data landing in Phase 5.</p>
      </div>
    </div>
  );
}
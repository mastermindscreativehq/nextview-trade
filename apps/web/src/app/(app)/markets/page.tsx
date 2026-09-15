import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markets — NEXTVIEW TRADE",
};

export default function MarketsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">Markets</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Browse and search tradable instruments across crypto, stocks, and ETFs.
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-text-muted">Market data landing in Phase 3.</p>
      </div>
    </div>
  );
}
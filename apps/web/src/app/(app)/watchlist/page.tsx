import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watchlist — NEXTVIEW TRADE",
};

export default function WatchlistPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">Watchlist</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Your saved instruments and quick access to quotes and trading.
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-text-muted">Watchlist landing in Phase 3.</p>
      </div>
    </div>
  );
}
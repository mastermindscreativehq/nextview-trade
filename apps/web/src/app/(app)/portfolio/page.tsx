import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio — NEXTVIEW TRADE",
};

export default function PortfolioPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">Portfolio</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Total value, allocation, and performance across your paper positions.
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-text-muted">Portfolio data landing in Phase 5.</p>
      </div>
    </div>
  );
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deposits — NEXTVIEW TRADE",
};

export default function DepositsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">Deposits</h1>
      <p className="mt-1 text-sm text-text-secondary">Fund your account.</p>
      <div className="mt-6 rounded-lg border border-border bg-warning-bg p-6">
        <p className="text-sm font-medium text-warning">
          Real-money funding is not available in the current paper-trading release.
        </p>
        <p className="mt-1 text-sm text-warning-muted">
          NEXTVIEW TRADE is a paper trading platform in this version. Deposit functionality will be
          introduced when real-money funding becomes available.
        </p>
      </div>
    </div>
  );
}
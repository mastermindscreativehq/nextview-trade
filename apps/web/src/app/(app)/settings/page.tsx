import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — NEXTVIEW TRADE",
};

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">Account preferences and paper trading configuration.</p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-text-muted">Settings landing in a later phase.</p>
      </div>
    </div>
  );
}
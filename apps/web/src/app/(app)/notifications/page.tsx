import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications — NEXTVIEW TRADE",
};

export default function NotificationsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">Notifications</h1>
      <p className="mt-1 text-sm text-text-secondary">Alerts and updates about your paper account.</p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-text-muted">Notifications landing in a later phase.</p>
      </div>
    </div>
  );
}
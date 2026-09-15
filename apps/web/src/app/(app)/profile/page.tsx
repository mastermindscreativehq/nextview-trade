import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile — NEXTVIEW TRADE",
};

export default function ProfilePage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">Profile</h1>
      <p className="mt-1 text-sm text-text-secondary">Your personal account details.</p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-text-muted">Profile landing in a later phase.</p>
      </div>
    </div>
  );
}
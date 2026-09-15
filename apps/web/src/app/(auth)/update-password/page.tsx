import type { Metadata } from "next";
import Link from "next/link";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "Update password — NEXTVIEW TRADE",
};

export default function UpdatePasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-xl font-semibold text-text-primary">Choose a new password</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Set a new password for your account. You will be signed back in with it.
      </p>
      <div className="mt-6">
        <UpdatePasswordForm />
      </div>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Back to{" "}
        <Link href="/login" className="text-accent-hover hover:underline">
          sign in
        </Link>
      </p>
    </div>
  );
}
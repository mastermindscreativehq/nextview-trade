import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password — NEXTVIEW TRADE",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-xl font-semibold text-text-primary">Reset your password</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Enter your email and we will send you a reset link.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Remembered your password?{" "}
        <Link href="/login" className="text-accent-hover hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
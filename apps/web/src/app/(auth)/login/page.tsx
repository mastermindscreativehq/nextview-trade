import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in — NEXTVIEW TRADE",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-xl font-semibold text-text-primary">Sign in</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Welcome back. Sign in to access your paper account.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-text-secondary">
        New to NEXTVIEW?{" "}
        <Link href="/register" className="text-accent-hover hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account — NEXTVIEW TRADE",
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-xl font-semibold text-text-primary">Create your account</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Start paper trading with $100,000 in virtual funds.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-hover hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
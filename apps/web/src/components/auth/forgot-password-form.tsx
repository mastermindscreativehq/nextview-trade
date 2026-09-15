"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      const { error: resetError } = await getBrowserClient().auth.resetPasswordForEmail(
        values.email,
        { redirectTo: `${window.location.origin}/update-password` }
      );
      if (resetError) {
        setError("Something went wrong. Please try again.");
        return;
      }
      setSuccess("If that email is registered, a password reset link has been sent.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={errors.email ? "true" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-negative" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-negative-bg bg-negative-bg px-3 py-2 text-sm text-negative" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-positive-bg bg-positive-bg px-3 py-2 text-sm text-positive" role="status">
          {success}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
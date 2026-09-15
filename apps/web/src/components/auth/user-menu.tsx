"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initialsFrom(email?: string | null): string {
  if (!email) {
    return "?";
  }
  const local = email.split("@")[0] ?? "";
  return local.slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const { user, isLoading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  if (isLoading || !user) {
    return (
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated"
        aria-hidden="true"
      >
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-text-muted" />
      </div>
    );
  }

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Account menu"
        >
          <Avatar>
            <AvatarFallback>{initialsFrom(user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-text-primary">{user.email}</p>
          <p className="text-xs text-text-muted">Paper trading account</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          disabled={isSigningOut}
        >
          <LogOut />
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
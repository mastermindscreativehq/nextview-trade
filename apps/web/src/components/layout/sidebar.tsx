"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNav, accountNav } from "@/components/navigation/nav-items";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className={cn("flex h-full w-60 flex-col border-r border-border bg-surface", className)}>
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-semibold tracking-tight text-text-primary">
            NEXTVIEW
          </span>
          <span className="rounded bg-accent-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
            Paper
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label="Primary navigation">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Trading
        </p>
        <ul className="space-y-0.5">
          {mainNav.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-surface-elevated text-text-primary"
                      : "text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>

        <Separator className="my-3" />

        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Account
        </p>
        <ul className="space-y-0.5">
          {accountNav.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-surface-elevated text-text-primary"
                      : "text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs leading-relaxed text-text-muted">
          Paper trading simulation. No real money involved.
        </p>
      </div>
    </aside>
  );
}
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-text-primary">NEXTVIEW</span>
          <span className="rounded bg-accent-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
            Trade
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          <Link href="/markets" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
            Markets
          </Link>
          <Link href="#product" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
            Product
          </Link>
          <Link href="#paper-trading" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
            Paper trading
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
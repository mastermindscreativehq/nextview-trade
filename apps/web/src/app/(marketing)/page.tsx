import type { Metadata } from "next";
import Link from "next/link";
import {
  LineChart,
  ShieldCheck,
  Zap,
  CandlestickChart,
  Layers,
  BookOpen,
  ArrowRight,
  MonitorCheck,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { HeroChart } from "@/components/marketing/hero-chart";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "NEXTVIEW TRADE — See the Market Differently",
  description:
    "A modern, premium paper trading platform. Practice trading stocks, ETFs, and crypto with virtual funds — no real money required.",
};

const features = [
  {
    icon: CandlestickChart,
    title: "Professional charts",
    description:
      "Institutional-grade candlestick charting with volume, timeframes, and crosshair precision built on Lightweight Charts.",
  },
  {
    icon: ShieldCheck,
    title: "Paper trading only",
    description:
      "Practice with $100,000 in virtual funds. No real money moves. Build strategy and confidence safely.",
  },
  {
    icon: Layers,
    title: "Order engine you can trust",
    description:
      "Server-authenticated order execution with a full ledger. Every balance change is recorded and auditable.",
  },
  {
    icon: Zap,
    title: "Fast, responsive terminal",
    description:
      "A dark-first, information-dense workspace designed for scanning the market quickly — on desktop and mobile.",
  },
  {
    icon: BookOpen,
    title: "Complete activity history",
    description:
      "Orders, trades, positions, and transactions with transparent pricing and realized and unrealized P&L.",
  },
  {
    icon: MonitorCheck,
    title: "Built to grow",
    description:
      "Clean separation between frontend and backend so real-money infrastructure can be introduced later without rebuilding.",
  },
];

const instruments = [
  { group: "Crypto", symbols: ["BTC/USD", "ETH/USD", "SOL/USD"] },
  { group: "Stocks", symbols: ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN"] },
  { group: "ETFs", symbols: ["SPY", "QQQ"] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <main id="product">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24" aria-labelledby="hero-heading">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-medium text-text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-positive" aria-hidden="true" />
                Paper trading platform
              </p>

              <h1
                id="hero-heading"
                className="mt-6 text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl lg:text-6xl"
              >
                NEXTVIEW
                <span className="block bg-gradient-to-r from-accent-hover to-accent bg-clip-text text-transparent">
                  TRADE
                </span>
              </h1>

              <p className="mt-4 text-xl font-medium text-text-secondary">See the market differently.</p>

              <p className="mt-4 max-w-lg leading-relaxed text-text-secondary">
                NEXTVIEW is a modern trading platform for exploring markets with confidence.
                Practice on professional-quality charts, place orders against a reliable
                paper-trading engine, and track every trade in a transparent ledger.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register">
                  <Button size="lg">
                    Create free account
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/markets">
                  <Button variant="secondary" size="lg">
                    Explore platform
                  </Button>
                </Link>
              </div>

              <p className="mt-4 text-xs text-text-muted">
                Virtual funds only · No real money deposits · Discretionary environment
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-accent/5 blur-3xl" aria-hidden="true" />
              <HeroChart />
            </div>
          </div>
        </section>

        {/* Instruments strip */}
        <section className="border-y border-border bg-surface" aria-label="Supported instruments">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="grid gap-6 sm:grid-cols-3">
              {instruments.map((group) => (
                <div key={group.group}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    {group.group}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.symbols.map((symbol) => (
                      <Link
                        key={symbol}
                        href={`/trade/${symbol}`}
                        className="rounded-md border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
                      >
                        {symbol}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 py-20" aria-labelledby="features-heading">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="features-heading" className="text-3xl font-semibold tracking-tight text-text-primary">
              Built like a trading terminal, not a dashboard
            </h2>
            <p className="mt-3 text-text-secondary">
              Every surface is designed for decision-making: semantic colors, tabular numerals,
              dense but organized information, and a focus on the market — not the chrome.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/40"
              >
                <feature.icon className="h-5 w-5 text-accent-hover" aria-hidden="true" />
                <h3 className="mt-4 text-sm font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Paper trading */}
        <section id="paper-trading" className="border-y border-border bg-surface py-20" aria-labelledby="paper-heading">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
                Paper trading
              </p>
              <h2 id="paper-heading" className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
                Master the market with virtual money
              </h2>
              <p className="mt-4 text-text-secondary">
                Every account starts with <span className="font-semibold text-text-primary">$100,000 in virtual USD</span>.
                Trade stocks, ETFs, and crypto through a market-aware order engine, watch positions
                update in real time, and review a full audit ledger of every financial event.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Server-validated order execution — no client-side manipulation",
                  "Immutable ledger tracking every balance change",
                  "Realistic position, P&L, and portfolio metrics",
                  "Clear paper-trading labeling throughout the app",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-text-secondary">
                    <LineChart className="mt-0.5 h-4 w-4 shrink-0 text-positive" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/register">
                  <Button size="lg">Start paper trading</Button>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                About this release
              </p>
              <div className="mt-4 space-y-3 text-sm text-text-secondary">
                <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-elevated p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                  <p>
                    <span className="font-medium text-text-primary">No real money.</span> Deposits and
                    withdrawals are not available in this paper-trading release.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-elevated p-4">
                  <Layers className="mt-0.5 h-4 w-4 shrink-0 text-accent-hover" aria-hidden="true" />
                  <p>
                    <span className="font-medium text-text-primary">Clear audit trail.</span> Every
                    virtual funding and trade is recorded in your transaction history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20" aria-labelledby="cta-heading">
          <div className="rounded-2xl border border-border bg-surface-elevated p-10 text-center sm:p-14">
            <h2 id="cta-heading" className="text-3xl font-semibold tracking-tight text-text-primary">
              See the market differently.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              Create your free paper trading account and start exploring markets today. No credit card,
              no deposits required.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button size="lg">
                  Create free account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/markets">
                <Button variant="secondary" size="lg">
                  Explore platform
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-text-primary">NEXTVIEW</span>
            <span className="rounded bg-accent-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
              Trade
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Paper trading simulation. Virtual funds only. Not investment advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
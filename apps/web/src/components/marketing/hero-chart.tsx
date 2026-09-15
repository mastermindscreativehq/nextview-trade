"use client";

import * as React from "react";
import { getCandles } from "@/lib/mock-markets";
import { TradingChart } from "@/components/charts/trading-chart";

const HERO_SYMBOL = "BTC/USD";

export function HeroChart() {
  const candles = React.useMemo(() => getCandles(HERO_SYMBOL, "1h", 120), []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-text-primary">BTC/USD</span>
          <span className="rounded bg-accent-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
            Live demo
          </span>
        </div>
        <div className="flex items-center gap-1" aria-hidden="true">
          {["1H", "4H", "1D"].map((tf) => (
            <span
              key={tf}
              className={`rounded px-2 py-0.5 font-mono text-[11px] ${
                tf === "1H" ? "bg-surface-elevated text-text-primary" : "text-text-muted"
              }`}
            >
              {tf}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[320px] w-full sm:h-[380px]">
        <TradingChart symbol={HERO_SYMBOL} candles={candles} />
      </div>
    </div>
  );
}
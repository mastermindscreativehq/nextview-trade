import { cn, formatNumber } from "@/lib/utils";

interface PriceChangeProps {
  change: number;
  changePercent: number;
  className?: string;
  showIcon?: boolean;
}

export function PriceChange({ change, changePercent, className, showIcon = false }: PriceChangeProps) {
  const positive = change >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-sm font-medium tabular-nums",
        positive ? "text-positive" : "text-negative",
        className
      )}
      aria-label={`${positive ? "up" : "down"} ${formatNumber(Math.abs(change))}, ${formatNumber(Math.abs(changePercent))} percent`}
    >
      {showIcon && <span aria-hidden="true">{positive ? "▲" : "▼"}</span>}
      <span aria-hidden="true">{formatNumber(change)}</span>
      <span aria-hidden="true">({formatNumber(changePercent, 2)}%)</span>
    </span>
  );
}
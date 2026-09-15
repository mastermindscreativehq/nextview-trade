import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: "positive" | "negative" | "neutral";
  className?: string;
}

export function MetricCard({ label, value, subValue, trend = "neutral", className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-xl font-semibold tabular-nums",
          trend === "positive" && "text-positive",
          trend === "negative" && "text-negative",
          trend === "neutral" && "text-text-primary"
        )}
      >
        {value}
      </p>
      {subValue && (
        <p className="mt-0.5 text-xs text-text-secondary tabular-nums">{subValue}</p>
      )}
    </div>
  );
}
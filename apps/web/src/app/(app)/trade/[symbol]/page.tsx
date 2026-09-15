import type { Metadata } from "next";

interface TradePageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: TradePageProps): Promise<Metadata> {
  const { symbol } = await params;
  return {
    title: `Trade ${symbol} — NEXTVIEW TRADE`,
  };
}

export default async function TradePage({ params }: TradePageProps) {
  const { symbol } = await params;
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-text-primary">{symbol}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Professional charting and order ticket for {symbol}.
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-sm text-text-muted">Trading view landing in Phase 3.</p>
      </div>
    </div>
  );
}
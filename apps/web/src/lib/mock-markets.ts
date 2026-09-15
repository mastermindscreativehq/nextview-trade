import type { Asset, Quote, Candle, Timeframe } from "@/types";

export const INSTRUMENTS: Asset[] = [
  { symbol: "BTC/USD", name: "Bitcoin", assetType: "crypto", exchange: "CRYPTO" },
  { symbol: "ETH/USD", name: "Ethereum", assetType: "crypto", exchange: "CRYPTO" },
  { symbol: "SOL/USD", name: "Solana", assetType: "crypto", exchange: "CRYPTO" },
  { symbol: "AAPL", name: "Apple Inc.", assetType: "stock", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corp.", assetType: "stock", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corp.", assetType: "stock", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", assetType: "stock", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", assetType: "stock", exchange: "NASDAQ" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", assetType: "etf", exchange: "NYSEARCA" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", assetType: "etf", exchange: "NASDAQ" },
];

const BASE_PRICES: Record<string, number> = {
  "BTC/USD": 67420,
  "ETH/USD": 3520,
  "SOL/USD": 172,
  AAPL: 228,
  MSFT: 442,
  NVDA: 128,
  TSLA: 248,
  AMZN: 196,
  SPY: 545,
  QQQ: 472,
};

const LOOKUPS: Record<string, [number, number]> = {
  "BTC/USD": [1, 320],
  "ETH/USD": [1, 180],
  "SOL/USD": [1, 14],
  AAPL: [1, 3.2],
  MSFT: [1, 5.4],
  NVDA: [1, 2.4],
  TSLA: [1, 5.8],
  AMZN: [1, 3.1],
  SPY: [1, 4.2],
  QQQ: [1, 3.6],
};

export const TIMEFRAMES: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function getQuote(symbol: string): Quote {
  const base = BASE_PRICES[symbol];
  if (!base) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }
  const random = seededRandom(hashString(`${symbol}:${new Date().toISOString().slice(0, 13)}`));
  const [_, amount] = LOOKUPS[symbol] ?? [1, 2];

  const change = (random() * 2 - 1) * amount;
  const changePercent = (change / base) * 100;
  const open = base;
  const price = base + change;
  const high = Math.max(open, price) + random() * amount * 0.5;
  const low = Math.min(open, price) - random() * amount * 0.5;
  const volume = Math.floor(random() * 2_500_000) + 100_000;

  return {
    symbol,
    price,
    change,
    changePercent,
    open,
    high,
    low,
    previousClose: open,
    volume,
    timestamp: new Date().toISOString(),
  };
}

export function getQuotes(symbols: string[]): Quote[] {
  return symbols.map(getQuote);
}

export function getCandles(symbol: string, timeframe: Timeframe, count = 120): Candle[] {
  const base = BASE_PRICES[symbol];
  if (!base) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }
  const [multicol, amount] = LOOKUPS[symbol] ?? [1, 2];
  const random = seededRandom(hashString(`${symbol}:${timeframe}`));
  const step = TIMEFRAMES[timeframe];

  const now = Math.floor(Date.now() / 1000);
  const startTime = now - count * step;

  const candles: Candle[] = [];
  let price = base * (0.965 + random() * 0.07);

  for (let i = 0; i < count; i++) {
    const drift = (random() - 0.5) * 0.04 * multicol;
    const open = price;
    const close = Math.max(1, open * (1 + drift));
    const wick = amount * multicol * 0.05;
    const high = Math.max(open, close) * (1 + random() * 0.02 * multicol) + wick;
    const low = Math.min(open, close) * (1 - random() * 0.02 * multicol) - wick;
    const volume = Math.floor(random() * 1_200_000) + 50_000;
    price = close;

    candles.push({
      time: startTime + i * step,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return candles;
}

export function searchSymbols(query: string): Asset[] {
  const q = query.trim().toLowerCase();
  if (!q) return INSTRUMENTS;
  return INSTRUMENTS.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(q) || asset.name.toLowerCase().includes(q)
  );
}
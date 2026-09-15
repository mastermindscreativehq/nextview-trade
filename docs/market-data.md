# Market Data — NEXTVIEW TRADE

## Architecture

Market data uses a provider abstraction to avoid vendor lock-in.

### MarketDataProvider Interface

```typescript
interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getCandles(symbol: string, timeframe: Timeframe, range: CandleRange): Promise<Candle[]>;
  searchSymbols(query: string): Promise<SymbolSearchResult[]>;
  getMarketStatus(): Promise<MarketStatus>;
}
```

## Current Implementation

For v1, deterministic mock data is used for development.

Mock data is clearly separated from provider-backed data.

## Supported Instruments

### Crypto
- BTC/USD
- ETH/USD
- SOL/USD

### Stocks
- AAPL, MSFT, NVDA, TSLA, AMZN

### ETFs
- SPY, QQQ

## Data Types

### Quote
- symbol, price, change, changePercent, volume, high, low, open, previousClose, timestamp

### Candle
- time, open, high, low, close, volume

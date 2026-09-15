export type AssetType = "stock" | "etf" | "crypto";

export interface Asset {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: string;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  timestamp: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";

export interface TradingAccount {
  id: string;
  accountType: "paper";
  accountStatus: AccountStatus;
}

export interface Balance {
  accountId: string;
  currency: string;
  available: string;
  reserved: string;
}

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit";
export type OrderStatus =
  | "pending"
  | "filled"
  | "partially_filled"
  | "cancelled"
  | "rejected";

export interface Order {
  id: string;
  accountId: string;
  assetId: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: string;
  limitPrice: string | null;
  status: OrderStatus;
  filledQuantity: string;
  averagePrice: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  accountId: string;
  assetId: string;
  symbol: string;
  quantity: string;
  averageEntryPrice: string;
  currentPrice: string;
  marketValue: string;
  unrealizedPnl: string;
  unrealizedPnlPercent: string;
  createdAt: string;
  updatedAt: string;
}

export type LedgerEntryType =
  | "INITIAL_FUNDING"
  | "TRADE_BUY"
  | "TRADE_SELL"
  | "TRADING_FEE"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "ADJUSTMENT";

export interface LedgerEntry {
  id: string;
  accountId: string;
  entryType: LedgerEntryType;
  amount: string;
  balanceAfter: string;
  referenceId: string | null;
  referenceType: string | null;
  description: string;
  createdAt: string;
}

export type TransactionType = "TRADE" | "FEE" | "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT";
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface Transaction {
  id: string;
  accountId: string;
  transactionType: TransactionType;
  amount: string;
  status: TransactionStatus;
  description: string;
  referenceId: string | null;
  createdAt: string;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
}
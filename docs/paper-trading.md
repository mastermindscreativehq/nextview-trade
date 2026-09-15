# Paper Trading Engine — NEXTVIEW TRADE

## Overview

All trading in this release is paper trading only. No real money is involved.

## Initial Account

- Every new user receives a paper trading account
- Funded with $100,000 virtual USD
- Clearly labeled as paper trading throughout the UI

## Supported Operations

- Buy orders (market)
- Sell orders (market)
- Position management (long only)

## Order Execution

Market orders execute at the current available price (mock or provider-backed).

## Financial Rules

1. Never allow negative balance (cash account)
2. Never use JavaScript floating-point for authoritative calculations
3. All financial operations must be atomic
4. Every balance change produces a ledger entry
5. Ledger entries are append-only
6. Backend is authoritative for all financial state
7. Client never submits trusted financial values

## What is NOT Implemented

- Real deposits or withdrawals
- Margin trading
- Short selling
- Options or derivatives
- Leverage
- Complex order types (stop, trailing, etc.)
- Real payment processing

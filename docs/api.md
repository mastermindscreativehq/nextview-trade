# API — NEXTVIEW TRADE

## Base URL

- Local: `http://localhost:3001`
- Production: set per environment

## Authentication

Authenticated endpoints require:

```
Authorization: Bearer <supabase-access-token>
```

The backend verifies the JWT against Supabase before processing any request.

## Response Shape

Successful responses wrap the resource:

```json
{
  "data": { ... }
}
```

Errors return:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": {}
  }
}
```

Codes: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404),
`VALIDATION_ERROR` (400), `CONFLICT` (409), `INTERNAL` (500).

## Endpoints

### Health

`GET /health` — no auth

```json
{
  "status": "ok",
  "service": "nextview-api",
  "timestamp": "...",
  "version": "0.1.0"
}
```

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/logout` | Yes | Records an `auth.logout` audit entry; returns `{ "data": { "ok": true } }` |

### Account

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/account` | Yes | Authoritative snapshot: profile + paper trading account + balances |
| GET | `/api/account/balances?currency=USD` | Yes | Cash balances (optional 3-letter currency filter) |

The user identity always comes from the verified JWT; account rows are scoped
to that user server-side (`services/account.service.ts`). Balances arrive as
decimal strings (e.g. `"100000.00"`) — format for display, never parse to float.

The following tables describe endpoints planned for later phases (market data,
portfolio, orders, watchlist, notifications) and are not implemented yet.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/markets` | No | List instruments with quotes (Phase 2) |
| GET | `/api/markets/:symbol` | No | Quote for one instrument (Phase 2) |
| GET | `/api/markets/:symbol/candles?timeframe=1h&count=120` | No | OHLCV candles (Phase 2) |

### Account

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/account` | Yes | Trading account + profile |
| GET | `/api/account/balances` | Yes | Cash balances |

### Portfolio

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/portfolio` | Yes | Total value, P&L, allocation (Phase 2) |
| GET | `/api/positions` | Yes | Open positions (Phase 2) |
| GET | `/api/orders` | Yes | Order history (Phase 2) |
| GET | `/api/trades` | Yes | Executed trades (Phase 2) |
| GET | `/api/transactions` | Yes | Activity history (Phase 2) |

### Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/orders` | Yes | Submit order (Phase 2) |
| POST | `/api/orders/:id/cancel` | Yes | Cancel open order (Phase 2) |

Order request body:

```json
{
  "symbol": "AAPL",
  "side": "buy",
  "type": "market",
  "quantity": "10",
  "limitPrice": "230.00",
  "idempotencyKey": "uuid-or-opaque-token"
}
```

`idempotencyKey` is required and prevents duplicate execution on retry.

### Watchlist

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/watchlist` | Yes | User's watchlist (Phase 2) |
| POST | `/api/watchlist` | Yes | Add symbol (Phase 2) |
| DELETE | `/api/watchlist/:symbol` | Yes | Remove symbol (Phase 2) |

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications` | Yes | User notifications (Phase 3) |
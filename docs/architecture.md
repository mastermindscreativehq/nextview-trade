# NEXTVIEW TRADE — Architecture

## Overview

NEXTVIEW TRADE is a premium paper-trading platform built as a TypeScript monorepo with pnpm workspaces.

## Monorepo Structure

```
nextview-trade/
├── apps/
│   ├── web/          # Next.js 15 frontend (App Router)
│   └── api/          # Fastify backend API
├── docs/             # Documentation
├── scripts/          # Build/deploy scripts
├── .agents/skills/   # OpenCode agent skills
└── pnpm-workspace.yaml
```

## Frontend (`apps/web`)

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Charts:** TradingView Lightweight Charts v5
- **Data:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Animation:** Motion (framer-motion successor)

### Component Architecture

```
components/
├── ui/              # shadcn/ui primitives
├── layout/          # AppShell, Sidebar, TopBar
├── navigation/      # Nav items, breadcrumbs
├── charts/          # TradingChart, chart utilities
├── trading/         # OrderTicket, TradeForm
├── markets/         # QuoteCard, MarketTable
├── portfolio/       # PortfolioSummary, AllocationChart
├── orders/          # OrderTable, OrderFilters
├── watchlist/       # WatchlistTable
└── feedback/        # EmptyState, ErrorState, LoadingState
```

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Authentication |
| `/register` | Registration |
| `/forgot-password` | Password recovery |
| `/update-password` | Set a new password from a reset link |
| `/dashboard` | Trading terminal overview |
| `/markets` | Browse instruments |
| `/trade/[symbol]` | Chart + order ticket |
| `/portfolio` | Portfolio summary |
| `/positions` | Open positions |
| `/orders` | Order history |
| `/transactions` | Activity/ledger |
| `/watchlist` | User watchlist |
| `/settings` | Account settings |
| `/profile` | User profile |
| `/notifications` | Notifications |

## Backend (`apps/api`)

- **Runtime:** Node.js
- **Framework:** Fastify
- **Language:** TypeScript (strict)
- **Validation:** Zod
- **Database:** PostgreSQL via Supabase client

### API Structure

```
src/
├── app.ts           # buildApp(): cors, helmet, rate-limit, auth, routes, error contract
├── server.ts        # entrypoint (listen)
├── config/          # env.ts (Zod-validated, fail fast)
├── plugins/         # Fastify plugins (auth)
├── routes/          # Route handlers by domain
│   ├── auth.ts
│   ├── health.ts
│   └── account.ts
├── services/        # Business logic
│   └── account.service.ts
├── repositories/    # Database queries
│   └── account.repository.ts
├── lib/             # Utilities (supabase clients, http-error, validation, auth)
└── types/           # fastify augmentation
```

### Endpoints

Implemented:

```
GET    /health
GET    /api/account
GET    /api/account/balances
POST   /api/auth/logout
```

Planned (later phases):

```
GET    /api/markets
GET    /api/markets/:symbol
GET    /api/markets/:symbol/candles
GET    /api/portfolio
GET    /api/positions
GET    /api/orders
GET    /api/trades
GET    /api/transactions
POST   /api/orders
POST   /api/orders/:id/cancel
GET    /api/watchlist
POST   /api/watchlist
DELETE /api/watchlist/:symbol
GET    /api/notifications
```

## Authentication

- Supabase Auth for user management; sessions persisted via `@supabase/ssr`
  cookies (browser client, server client, middleware).
- `apps/web/src/middleware.ts` server-side route protection: unauthenticated
  users are redirected to `/login` on protected pages; signed-in users are kept
  off the login/registration screens.
- JWT-based session verification on every authenticated API route.
- Provisioning (profile + paper account + $100k + ledger + watchlist +
  notification) happens in the database via the `handle_new_user()` trigger —
  no client or API code can grant funds.
- Audit trail for registration, login, password-reset, and logout (DB triggers
  + `POST /api/auth/logout`).

## Paper Trading Engine

### Execution Flow

1. Client submits order → Backend authenticates
2. Backend validates order parameters
3. Backend validates account balance / position rules
4. Backend determines execution (price, fill)
5. Atomic transaction: create trade, update position, update balance, create ledger entry
6. Authoritative result returned to client

### Financial Model

- Cash account (no margin/leverage)
- Long positions only
- Market orders (primary), limit orders (foundation)
- $100,000 virtual USD on registration
- All financial values stored as NUMERIC/DECIMAL

### Ledger

- Append-only financial event log
- Every balance change produces a ledger entry
- Supports audit of account balance history
- Never directly modifiable by clients

## Security

- RLS on all user-owned tables
- Ownership checks on all data access
- Zod validation on all inputs
- No client-trusted financial state
- No service-role keys in frontend
- Idempotency on order submission
- Audit logging for sensitive operations

## Design System

- Dark-first, premium financial aesthetic
- Semantic design tokens via CSS variables
- OKLCH-based color tokens
- Financial colors with semantic meaning (positive/negative)
- Tabular/monospaced numerals for financial data
- Responsive: desktop-first, mobile-adaptive

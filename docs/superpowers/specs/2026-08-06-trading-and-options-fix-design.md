# TradeShala: Trading Flow & Options Correction — Design

Date: 2026-08-06
Status: Approved, pending implementation plan

## Context

TradeShala is a **paper-trading simulator** (no real money, no real broker
integration — this constraint applies to every decision below). Tracing the
buy/sell flow end to end surfaced two problems the user asked to fix:

1. The trading flow itself has multiple correctness bugs.
2. The "Options" trade type is cosmetic — the UI collects strike price,
   expiry, and CE/PE, but none of it reaches the backend, and a user who
   selects "Options" and buys silently gets a plain equity order.

### Current state (as found)

There are **two independent buy/sell implementations**:

- **Live path** (what the UI actually uses): `TradingPanel.tsx` → Socket.IO
  `placeOrder`/`completeOrder` events → `server/lib/socketio.js` → writes to
  `Order.Model.js` + `Portfolio.Model.js` (Mongoose model `"Portfolio"`,
  holdings array).
- **Orphaned REST path**: `POST /api/transactions/buy` / `/sell`
  (`BuyNSell.Controller.js`), fully routed and functional server-side, but
  **no client code calls it**. It writes to a *different* schema
  (`IndiPortfolio.Model.js`, Mongoose model `"NewPortfolio"`) than the one the
  live path and the portfolio-read API (`Portfolio.Controller.js`) use. If
  ever wired up, its writes would be invisible to the rest of the app.

Confirmed bugs in the live path:

- Options/Futures fields (strike, expiry, CE/PE) are captured in
  `TradingPanel.tsx` state but never included in the `placeOrder` socket
  payload, and `Order.Model.js` has no schema fields for them.
- Margin is a flat `totalAmount * 0.2` regardless of instrument or
  buy/sell direction.
- Position close (`completeOrder`) always uses stock-style P&L math
  (`(exit - entry) * qty`), which will be wrong once options exist (options
  need premium-to-premium P&L, not spot-delta P&L).
- Stop Loss / Target / Trigger Price inputs exist in the UI but are dropped
  before the socket emit — never persisted, never enforced.
- `virtualBalance` gets silently reset to 100000 any time it reads `<= 0`,
  inside the `placeOrder` handler — a user who legitimately trades to zero
  gets an unearned refill instead of being blocked.
- `execution_price` for market orders is taken verbatim from the client with
  no server-side sanity check against a known price.
- `Wallet.tsx` is entirely local `useState` mock data — its balance and
  transaction history are disconnected from `virtualBalance` and the real
  `Transaction` model.

## Decisions

- Dead/unused `TradeContext` (`client/src/context/context.tsx`) and
  `Positions.tsx` (nothing renders them) are left untouched — out of scope.
- The orphaned REST buy/sell route is **kept and fixed**, not deleted: it
  will be repointed at the same `Portfolio.Model.js` the live path uses, so
  it becomes a valid alternate API instead of a landmine.
- Options become a real feature: strike/expiry/CE-PE persist end to end,
  premiums are priced with simplified Black-Scholes, and closing an option
  position uses payoff-correct P&L.
- Stop Loss is wired using the **existing** (currently dead) `sl`/`sl-m`
  `order_type` enum and `priceReachedLimit` handler already in the schema —
  no new trigger engine. Target/take-profit is dropped from the UI: it was
  never backed by any schema mechanism and inventing one is out of scope.
- Margin uses fixed per-category multipliers, not a real SPAN-style margin
  engine (paper simulator, not a broker).

## 1. Data model changes

**`Order.Model.js`** — new fields, required only when
`order_category === "options"`:

- `option_type: "CE" | "PE"`
- `strike_price: Number`
- `expiry_date: Date`
- `underlying_price_at_entry: Number` — spot price when the premium was
  computed; needed to reprice at close.
- `trigger_price: Number` — used when `order_type` is `"sl"` / `"sl-m"`
  (schema enum already exists, was simply never populated).

**`Portfolio.Model.js`** holdings subdocument — same three option fields
added (`option_type`, `strike_price`, `expiry_date`). The dedupe key for an
existing holding becomes
`stock_symbol + trade_type + strike_price + expiry_date + option_type`
instead of just `stock_symbol + trade_type`, so a NIFTY 24000 CE and a NIFTY
24500 CE are tracked as separate holdings instead of collapsing together.

**`IndiPortfolio.Model.js`** — deleted. `BuyNSell.Controller.js` is
repointed to import `Portfolio.Model.js`.

## 2. Options pricing

New pure/stateless module `server/util/optionsPricing.js`:

- `calculatePremium({ spotPrice, strikePrice, expiryDate, optionType })` —
  standard Black-Scholes using fixed constants (no live IV/rate feed
  exists): `RISK_FREE_RATE = 0.07`, `ASSUMED_VOLATILITY = 0.28`. Time-to-
  expiry is `max(0, expiry - now)` in years, so the formula naturally
  converges to intrinsic value as expiry approaches — no special-cased
  expiry branch needed.
- `calculatePayoffPnL({ optionType, strikePrice, entryPremium, exitPremium, quantity })`
  — `(exitPremium - entryPremium) * quantity`. The nonlinear payoff is
  already captured because `exitPremium` comes from re-running
  `calculatePremium` at the current spot/time; this function is just the
  premium-to-premium delta.

Self-check: `server/util/test_optionsPricing.js`, assert-based, checks a
known Black-Scholes value against a hand-computed case (e.g. ATM call,
1-year expiry, standard textbook inputs) plus a near-expiry case converging
to intrinsic value.

## 3. Order placement (`socketio.js` `placeOrder`)

- Client includes `option_type`, `strike_price`, `expiry_date`,
  `underlying_price` (latest known spot) when `order_category === "options"`.
- Server validates: all three option fields required together,
  `expiry_date` in the future, `strike_price > 0`.
- Server computes the premium itself via `calculatePremium(...)` — never
  trusts a client-supplied option price. Market-order equity prices are
  similarly no longer trusted blindly: server uses its own last-known tick
  for that symbol (tracked from the existing `symbolData` feed) when
  available, falling back to the client-sent price only if no server-side
  tick exists yet. (No persistent cross-reconnect price cache — acceptable
  for paper trading, noted as a known gap rather than solved.)
- Margin charged to `virtualBalance` uses a fixed per-category table:
  - `delivery`: 100% of `price × qty`
  - `intraday`: 20% of `price × qty`
  - `futures`: fixed 15% of notional (explicitly not real SPAN)
  - `options` buy: 100% of premium × qty
  - `options` sell/write: fixed 20% of notional (naive margin proxy)

## 4. Closing positions (`completeOrder`)

- If the holding has `option_type` set: reprice via `calculatePremium` at
  current spot/time, then `calculatePayoffPnL` for the settlement amount.
- Non-option holdings: unchanged existing stock P&L math.

## 5. Bug fixes

- Remove the `virtualBalance <= 0 → reset to 100000` auto-refill inside
  `placeOrder`. Balance is seeded to 100000 only at user creation
  (`User.Model.js` default).
- Stop Loss field in `TradingPanel.tsx` now sets `order_type: "sl"` and
  `trigger_price` on the order instead of being dropped. `CurrentPositions.tsx`
  (which already receives live ticks via `symbolData`) emits
  `priceReachedLimit` for open SL orders on each tick, reusing the existing
  server-side handler. Target/take-profit input removed from the UI (no
  schema mechanism, not being added).
- `execution_price` trust fix as described in §3.

## 6. Wallet page

`Wallet.tsx` stops using local mock state. It fetches real
`virtualBalance` and real `Transaction` records (model already exists,
already written on every buy/sell) instead of hardcoded numbers. Deposit
becomes a real `virtualBalance += amount` write. Still paper money — just
made consistent with the balance actually used to gate trades, instead of
being a disconnected prop.

## Out of scope

- Target/take-profit auto-execution (no schema backing, not building one).
- Real SPAN margin calculation.
- Persistent server-side price cache across reconnects.
- Any change to `TradeContext`/`Positions.tsx` (confirmed dead code, left
  as-is).
- Real brokerage integration of any kind — this remains paper trading only.

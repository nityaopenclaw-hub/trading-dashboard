# Trading Dashboard

A full-stack algorithmic trading dashboard built on **ICT / Smart Money Concepts (SMC)** methodology. It fetches multi-timeframe OHLCV data, runs structural analysis (swing detection, BOS, liquidity sweeps, order blocks, FVGs), and surfaces signals to a live Next.js frontend. Paper trading is executed via the **Alpaca** broker API.

---

## Directory Structure

```
trading-dashboard/
├── trading-api/                  # Node.js backend (Express)
│   ├── core/                     # Algorithm & analysis engine
│   │   ├── ict-engine.js         # ICT/SMC pure-function analysis engine
│   │   └── algorithm.js          # Legacy shim (wraps ict-engine for backward compat)
│   ├── services/                 # External integrations & data layer
│   │   ├── alpaca.js             # Alpaca broker API client (orders, positions, account)
│   │   ├── data.js               # Multi-timeframe OHLCV fetching via yahoo-finance2
│   │   └── trades.js             # Trade execution & position management layer
│   ├── server/                   # HTTP server
│   │   ├── index.js              # Express app entry point
│   │   ├── routes.js             # API route definitions
│   │   └── scheduler.js          # Cron-based analysis runner (every 5 min)
│   ├── data/
│   │   └── trades.json           # Persisted trade log
│   └── package.json
│
└── frontend/                     # Next.js frontend (App Router)
    ├── app/
    │   ├── api/trading/route.ts  # Next.js API proxy to backend
    │   ├── components/           # UI components
    │   │   ├── Dashboard.tsx         # Root dashboard layout
    │   │   ├── AccountPanel.tsx      # Alpaca account summary
    │   │   ├── ICTMethodologyPanel.tsx # ICT confluence breakdown
    │   │   ├── ICTSignalsPanel.tsx   # Live ICT signals per symbol
    │   │   ├── MarketStructurePanel.tsx # BOS / swing structure view
    │   │   ├── PositionsPanel.tsx    # Open positions
    │   │   ├── TradeLog.tsx          # Filled order history
    │   │   └── TradingViewChart.tsx  # Embedded TradingView chart
    │   ├── types.ts              # Shared TypeScript types
    │   ├── page.tsx              # Root page
    │   └── layout.tsx            # App shell
    └── package.json
```

---

## How to Run

### Backend

```bash
cd trading-api
cp .env.example .env          # add ALPACA_KEY, ALPACA_SECRET, API_SECRET
npm install
npm start                     # starts on http://localhost:3002
```

The scheduler runs automatically on startup and refreshes analysis every 5 minutes.

**Environment variables:**

| Variable       | Description                            |
|----------------|----------------------------------------|
| `ALPACA_KEY`   | Alpaca paper API key                   |
| `ALPACA_SECRET`| Alpaca paper API secret                |
| `API_SECRET`   | Bearer token for frontend auth         |
| `PORT`         | HTTP port (default: `3002`)            |

### Frontend

```bash
cd frontend
npm install
npm run dev                   # starts on http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` (or configure `frontend/app/api/trading/route.ts`) to point to the backend.

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Backend    | Node.js, Express 5                              |
| Data       | yahoo-finance2 (multi-timeframe OHLCV)          |
| Broker     | Alpaca Markets (paper trading API)              |
| Scheduling | node-cron                                       |
| Algorithm  | Custom ICT/SMC engine (pure JS, no dependencies)|

---

## Algorithm Overview

The ICT engine (`trading-api/core/ict-engine.js`) is a stateless, pure-function analysis library implementing:

- **Swing Detection** — identifies swing highs/lows across all timeframes
- **Market Structure (BOS)** — Break of Structure confirmed by candle *close* (body), not wick
- **Liquidity Sweeps** — BSL/SSL detection (wick pierces level, body closes back inside)
- **Order Blocks** — last opposing candle before a sweep; marks active zones
- **Fair Value Gaps (FVG)** — 3-candle imbalances; tracks filled vs. unfilled
- **Equilibrium** — 50% midpoint of swing range; classifies price as discount/premium/at-equilibrium
- **Multi-TF Confluence Scoring** — 0–6 score across Daily, 4H, 1H, 15m alignment

A `BUY` or `SELL` signal requires **≥ 5/6 confluences**. Otherwise the engine returns `HOLD`.

import { NextRequest, NextResponse } from 'next/server';

const TRADING_API = process.env.TRADING_API_URL || 'http://localhost:3002';
const API_SECRET = process.env.TRADING_API_SECRET || 'trading-dev-secret';

const SYMBOL_NAMES: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^NDX': 'NASDAQ 100',
  'GC=F': 'Gold',
};

// ─── Legacy transformer (old EMA/RSI/MACD format) ────────────────────────────
function transformLegacySnapshot(raw: any) {
  const rawSignals = raw.signals || {};
  const signals = Object.entries(rawSignals).map(([sym, s]: [string, any]) => ({
    symbol: sym,
    name: SYMBOL_NAMES[sym] || sym,
    action: (s.signal || 'hold').toUpperCase() as 'BUY' | 'SELL' | 'HOLD',
    price: s.price || 0,
    trend: s.trend || 'neutral',
    ema20: s.ema20 || 0,
    ema50: s.ema50 || 0,
    rsi: s.rsi || 0,
    macd: s.macd || 0,
    reason: s.reason || '',
    computedAt: s.computedAt || new Date().toISOString(),
  }));

  const rawPositions = raw.positions || {};
  const positions = Object.values(rawPositions)
    .filter(Boolean)
    .map((p: any) => ({
      id: `${p.symbol}-${p.entryTime}`,
      symbol: p.symbol,
      name: SYMBOL_NAMES[p.symbol] || p.symbol,
      side: (p.side || 'LONG').toUpperCase() as 'LONG' | 'SHORT',
      entryPrice: p.entryPrice || 0,
      currentPrice: p.currentPrice || p.entryPrice || 0,
      pnl: p.unrealizedPnL || 0,
      pnlPct: p.entryPrice ? ((p.unrealizedPnL || 0) / p.entryPrice) * 100 : 0,
      openedAt: p.entryTime || new Date().toISOString(),
    }));

  const trades = (raw.history || []).slice(-100).map((t: any) => ({
    id: t.id || `${t.symbol}-${t.entryTime}`,
    timestamp: t.exitTime || t.entryTime || new Date().toISOString(),
    symbol: t.symbol,
    name: SYMBOL_NAMES[t.symbol] || t.symbol,
    side: (t.side || 'LONG').toUpperCase() as 'LONG' | 'SHORT',
    entryPrice: t.entryPrice || 0,
    exitPrice: t.exitPrice || 0,
    pnl: t.pnl || 0,
    pnlPct: t.pnlPct || 0,
    status: (t.pnl || 0) >= 0 ? 'WIN' : 'LOSS',
    reason: t.reason || '',
  })).reverse();

  const rawStats = raw.stats || {};
  const stats = {
    winRate: rawStats.winRate || 0,
    totalPnl: rawStats.totalPnL || rawStats.totalPnl || 0,
    totalTrades: rawStats.totalTrades || 0,
    bestTrade: rawStats.bestTrade || 0,
  };

  const rawAccount = raw.account || raw.stats?.account || null;
  const account = rawAccount ? {
    equity: rawAccount.equity || 0,
    cash: rawAccount.cash || 0,
    buyingPower: rawAccount.buyingPower || 0,
    portfolioValue: rawAccount.portfolioValue || rawAccount.equity || 0,
    totalPnl: rawAccount.totalPnl || rawAccount.totalPnL || 0,
    status: rawAccount.status || 'ACTIVE',
  } : null;

  return { signals, positions, trades, stats, account };
}

// ─── ICT format transformer (new SMC format) ─────────────────────────────────
function transformICTSnapshot(raw: any) {
  // symbols pass-through — already in ICT format
  const symbols = raw.symbols || {};

  // Normalize positions (could be array or object)
  const rawPositions = raw.positions || {};
  const positions = Array.isArray(rawPositions)
    ? rawPositions.map((p: any) => ({
        id: p.id || `${p.symbol}-${p.entryTime || Date.now()}`,
        symbol: p.symbol,
        side: (p.side || 'LONG').toUpperCase() as 'LONG' | 'SHORT',
        entryPrice: p.entryPrice || 0,
        currentPrice: p.currentPrice || p.entryPrice || 0,
        pnl: p.unrealizedPnL || p.pnl || 0,
        pnlPct: p.pnlPct || (p.entryPrice ? ((p.unrealizedPnL || 0) / p.entryPrice) * 100 : 0),
        openedAt: p.entryTime || p.openedAt || new Date().toISOString(),
      }))
    : Object.values(rawPositions).filter(Boolean).map((p: any) => ({
        id: `${p.symbol}-${p.entryTime}`,
        symbol: p.symbol,
        side: (p.side || 'LONG').toUpperCase() as 'LONG' | 'SHORT',
        entryPrice: p.entryPrice || 0,
        currentPrice: p.currentPrice || p.entryPrice || 0,
        pnl: p.unrealizedPnL || 0,
        pnlPct: p.entryPrice ? ((p.unrealizedPnL || 0) / p.entryPrice) * 100 : 0,
        openedAt: p.entryTime || new Date().toISOString(),
      }));

  // Normalize trades
  const rawTrades = raw.trades || raw.history || [];
  const trades = rawTrades.slice(-100).map((t: any) => ({
    id: t.id || `${t.symbol}-${t.entryTime}`,
    timestamp: t.exitTime || t.timestamp || t.entryTime || new Date().toISOString(),
    symbol: t.symbol,
    side: (t.side || 'LONG').toUpperCase() as 'LONG' | 'SHORT',
    entryPrice: t.entryPrice || 0,
    exitPrice: t.exitPrice || 0,
    pnl: t.pnl || 0,
    pnlPct: t.pnlPct || 0,
    status: (t.pnl || 0) >= 0 ? 'WIN' : 'LOSS',
  }));

  const rawStats = raw.stats || {};
  const stats = {
    winRate: rawStats.winRate || 0,
    totalPnl: rawStats.totalPnL || rawStats.totalPnl || 0,
    totalTrades: rawStats.totalTrades || 0,
    bestTrade: rawStats.bestTrade || 0,
  };

  const rawAccount = raw.account || null;
  const account = rawAccount ? {
    equity: rawAccount.equity || 0,
    cash: rawAccount.cash || 0,
    buyingPower: rawAccount.buyingPower || 0,
    portfolioValue: rawAccount.portfolioValue || rawAccount.equity || 0,
    totalPnl: rawAccount.totalPnl || rawAccount.totalPnL || 0,
    status: rawAccount.status || 'ACTIVE',
  } : null;

  return {
    symbols,
    noTradeToday: raw.noTradeToday ?? false,
    newsEvents: raw.newsEvents || [],
    account,
    positions,
    trades,
    stats,
    snapshotAt: raw.snapshotAt || new Date().toISOString(),
  };
}

// ─── Empty ICT snapshot for fallback ─────────────────────────────────────────
function emptyICTSnapshot() {
  return {
    symbols: {},
    noTradeToday: false,
    newsEvents: [],
    account: null,
    positions: [],
    trades: [],
    stats: { winRate: 0, totalPnl: 0, totalTrades: 0, bestTrade: 0 },
    snapshotAt: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.searchParams.get('path') || '/api/snapshot';

  try {
    const res = await fetch(`${TRADING_API}${path}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(emptyICTSnapshot(), { status: 200 });
    }

    const raw = await res.json();

    if (path === '/api/snapshot' || path === '/api/signals') {
      // Detect format: new ICT format has `symbols` key
      if (raw && typeof raw.symbols === 'object' && !Array.isArray(raw.symbols)) {
        return NextResponse.json(transformICTSnapshot(raw), {
          headers: { 'Cache-Control': 'no-store' },
        });
      }
      // Fallback: old EMA/RSI format — wrap into ICT-compatible structure with empty symbols
      const legacy = transformLegacySnapshot(raw);
      return NextResponse.json({
        symbols: {},
        noTradeToday: false,
        newsEvents: [],
        ...legacy,
        snapshotAt: new Date().toISOString(),
      }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    return NextResponse.json(raw, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(emptyICTSnapshot(), { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.searchParams.get('path') || '/api/trade';
  const body = await req.json();

  try {
    const res = await fetch(`${TRADING_API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json(await res.json());
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
}

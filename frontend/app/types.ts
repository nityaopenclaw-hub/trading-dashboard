// ─── Legacy types (backward compat) ─────────────────────────────────────────

export interface Signal {
  symbol: string;
  name: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  ema20: number;
  ema50: number;
  rsi: number;
  macd: number;
  reason: string;
  computedAt: string;
}

export interface Snapshot {
  signals: Signal[];
  positions: Position[];
  trades: Trade[];
  stats: Stats;
  account?: Account | null;
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  openedAt: string;
}

export interface Trade {
  id: string;
  timestamp: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPct: number;
  status: 'WIN' | 'LOSS';
}

export interface Stats {
  winRate: number;
  totalPnl: number;
  totalTrades: number;
  bestTrade: number;
}

export interface Account {
  equity: number;
  cash: number;
  buyingPower: number;
  portfolioValue: number;
  totalPnl: number;
  status: string;
}

// ─── ICT / Smart Money Concepts types ─────────────────────────────────────────

export interface TFAlignment {
  daily: string;
  h4: string;
  h1: string;
  m15: string;
}

export interface OrderBlock {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  timeframe: string;
  active: boolean;
  date?: string;
}

export interface FVG {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  timeframe: string;
  filled: boolean;
  date?: string;
}

export interface LiquiditySweep {
  detected: boolean;
  side: 'bsl' | 'ssl' | null;
  level: number | null;
  date: string | null;
}

export interface ICTSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  maxConfidence: number;
  confluences: string[];
  missingConfluences: string[];
  reason: string;
  entryZone?: { high: number; low: number } | null;
  stopLevel?: number | null;
  tp1?: number | null;
}

export interface ICTSymbol {
  name: string;
  alpacaSymbol: string;
  price: number;
  trend: {
    direction: string;
    dailyBias: string;
    tfAlignment: TFAlignment;
    allAligned: boolean;
    alignedCount: number;
  };
  structure: {
    lastBOS: { direction: string; level: number; date: string } | null;
    recentHigh: number;
    recentLow: number;
    equilibrium: number;
    pricePosition: 'discount' | 'premium' | 'at_equilibrium';
  };
  orderBlocks: OrderBlock[];
  fvgs: FVG[];
  liquiditySweep: LiquiditySweep;
  signal: ICTSignal;
  computedAt?: string;
}

export interface ICTSnapshot {
  symbols: Record<string, ICTSymbol>;
  noTradeToday: boolean;
  newsEvents: string[];
  account?: Account | null;
  positions: Position[];
  trades: Trade[];
  stats: Stats;
  snapshotAt?: string;
}

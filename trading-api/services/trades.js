/**
 * trades.js — Alpaca paper trading execution layer
 * Replaces the old JSON-based paper engine with real Alpaca paper API calls.
 */

const alpaca = require('./alpaca');

// Symbol mapping: Yahoo Finance → Alpaca tradeable ETF
const SYMBOL_MAP = {
  '^GSPC': 'SPY',   // S&P 500
  '^NDX':  'QQQ',   // NASDAQ 100
  'GC=F':  'GLD',   // Gold
};

const SYMBOL_NAMES = {
  '^GSPC': 'S&P 500 (SPY)',
  '^NDX':  'NASDAQ 100 (QQQ)',
  'GC=F':  'Gold (GLD)',
};

function toAlpacaSymbol(symbol) {
  return SYMBOL_MAP[symbol] || symbol;
}

// ── Open a paper position ──────────────────────────────────────────────────
async function openPosition(yahooSymbol, side, price, reason = '') {
  const sym = toAlpacaSymbol(yahooSymbol);
  const alpacaSide = side.toLowerCase() === 'buy' ? 'buy' : 'sell';
  try {
    const order = await alpaca.placeOrder(sym, 1, alpacaSide, 'market', 'day');
    console.log(`[trades] Opened ${alpacaSide.toUpperCase()} ${sym}: order ${order.id} | reason: ${reason}`);
    return { success: true, order };
  } catch (err) {
    console.error(`[trades] Failed to open ${sym}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ── Close a paper position ─────────────────────────────────────────────────
async function closePosition(yahooSymbol, reason = '') {
  const sym = toAlpacaSymbol(yahooSymbol);
  try {
    const result = await alpaca.closePosition(sym);
    console.log(`[trades] Closed ${sym} | reason: ${reason}`);
    return { success: true, result };
  } catch (err) {
    console.error(`[trades] Failed to close ${sym}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ── Get current positions (formatted for dashboard) ───────────────────────
async function getPositions() {
  try {
    const raw = await alpaca.getPositions();
    if (!Array.isArray(raw)) return [];
    return raw.map(p => ({
      id: p.asset_id,
      symbol: p.symbol,
      alpacaSymbol: p.symbol,
      side: p.side === 'long' ? 'LONG' : 'SHORT',
      qty: parseFloat(p.qty),
      entryPrice: parseFloat(p.avg_entry_price),
      currentPrice: parseFloat(p.current_price),
      pnl: parseFloat(p.unrealized_pl),
      pnlPct: parseFloat(p.unrealized_plpc) * 100,
      marketValue: parseFloat(p.market_value),
      openedAt: new Date().toISOString(), // Alpaca doesn't return open time on positions
    }));
  } catch (err) {
    console.error('[trades] getPositions error:', err.message);
    return [];
  }
}

// ── Get trade history from Alpaca orders ──────────────────────────────────
async function getHistory(limit = 100) {
  try {
    const orders = await alpaca.getOrders('closed', limit);
    if (!Array.isArray(orders)) return [];
    return orders
      .filter(o => o.status === 'filled')
      .map(o => {
        const entryPrice = parseFloat(o.filled_avg_price) || 0;
        const pnl = 0; // Alpaca doesn't give P&L per order directly; would need to match buy/sell pairs
        return {
          id: o.id,
          symbol: o.symbol,
          side: o.side === 'buy' ? 'LONG' : 'SHORT',
          qty: parseFloat(o.filled_qty),
          entryPrice,
          exitPrice: entryPrice,
          entryTime: o.submitted_at,
          exitTime: o.filled_at,
          pnl,
          pnlPct: 0,
          reason: o.client_order_id || '',
          status: o.status,
        };
      });
  } catch (err) {
    console.error('[trades] getHistory error:', err.message);
    return [];
  }
}

// ── Account snapshot ──────────────────────────────────────────────────────
async function getAccount() {
  try {
    const acct = await alpaca.getAccount();
    return {
      equity: parseFloat(acct.equity),
      cash: parseFloat(acct.cash),
      buyingPower: parseFloat(acct.buying_power),
      portfolioValue: parseFloat(acct.portfolio_value),
      dayPnl: parseFloat(acct.unrealized_pl || 0),
      totalPnl: parseFloat(acct.equity) - 100000, // started with $100k
      status: acct.status,
    };
  } catch (err) {
    console.error('[trades] getAccount error:', err.message);
    return null;
  }
}

// ── Stats (derived from account + history) ────────────────────────────────
async function getStats() {
  const history = await getHistory(200);
  const filled = history.filter(t => t.status === 'filled');
  const account = await getAccount();
  return {
    totalTrades: filled.length,
    winRate: 0, // Can't compute without P&L matching — will improve
    totalPnL: account?.totalPnl || 0,
    bestTrade: 0,
    worstTrade: 0,
    account,
  };
}

// ── Check if position already open for a symbol ───────────────────────────
async function hasOpenPosition(yahooSymbol) {
  const sym = toAlpacaSymbol(yahooSymbol);
  const positions = await alpaca.getPositions();
  if (!Array.isArray(positions)) return false;
  return positions.some(p => p.symbol === sym);
}

module.exports = {
  openPosition,
  closePosition,
  getPositions,
  getHistory,
  getAccount,
  getStats,
  hasOpenPosition,
  toAlpacaSymbol,
  SYMBOL_MAP,
};

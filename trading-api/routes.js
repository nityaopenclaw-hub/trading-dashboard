/**
 * routes.js — ICT Trading API Routes
 * Serves cached ICT analysis snapshots from the scheduler.
 * Auto-trading DISABLED — read-only signals/analysis.
 */

'use strict';

const express = require('express');
const { INSTRUMENTS } = require('./data');
const { getSnapshot, getLastUpdated } = require('./scheduler');
const trades = require('./trades');

const router = express.Router();

// ── Auth middleware ────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const secret = process.env.API_SECRET || 'trading-dev-secret';
  const auth   = req.headers.authorization || '';
  const token  = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token !== secret) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── Health ────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    ok:          true,
    ts:          new Date().toISOString(),
    broker:      'alpaca-paper',
    engine:      'ICT/TJR Smart Money Concepts',
    autoTrading: false,
    lastUpdated: getLastUpdated()?.toISOString() || null,
  });
});

router.use('/api', requireAuth);

// ── GET /api/snapshot — main dashboard endpoint ────────────────────────────
router.get('/api/snapshot', async (req, res) => {
  try {
    let snapshot = getSnapshot();

    // If no cache yet, wait a bit and try again
    if (!snapshot) {
      return res.status(503).json({
        error:   'Analysis not ready yet — initial run in progress',
        message: 'Please retry in 30 seconds',
      });
    }

    res.json(snapshot);
  } catch (err) {
    console.error('[routes] /api/snapshot error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/signals — ICT signals for all symbols ────────────────────────
router.get('/api/signals', (req, res) => {
  const snapshot = getSnapshot();
  if (!snapshot) {
    return res.status(503).json({ error: 'Analysis not ready yet' });
  }

  const signals = {};
  for (const [symbol, data] of Object.entries(snapshot.symbols || {})) {
    signals[symbol] = {
      symbol,
      name:         data.name,
      price:        data.price,
      action:       data.signal?.action,
      confidence:   data.signal?.confidence,
      maxConfidence: data.signal?.maxConfidence,
      dailyBias:    data.trend?.dailyBias,
      tfAlignment:  data.trend?.tfAlignment,
      confluences:  data.signal?.confluences,
      reason:       data.signal?.reason,
      computedAt:   data.computedAt,
    };
  }

  res.json({ signals, fetchedAt: snapshot.snapshotAt });
});

// ── GET /api/structure/:symbol — detailed ICT structure for one symbol ─────
router.get('/api/structure/:symbol', (req, res) => {
  const snapshot = getSnapshot();
  if (!snapshot) {
    return res.status(503).json({ error: 'Analysis not ready yet' });
  }

  const symbol = req.params.symbol;
  const data   = snapshot.symbols?.[symbol];

  if (!data) {
    return res.status(404).json({
      error:     `Symbol ${symbol} not found`,
      available: Object.keys(snapshot.symbols || {}),
    });
  }

  res.json(data);
});

// ── GET /api/positions — from Alpaca ──────────────────────────────────────
router.get('/api/positions', async (req, res) => {
  const positions = await trades.getPositions();
  res.json({ positions });
});

// ── GET /api/trades — from Alpaca order history ───────────────────────────
router.get('/api/trades', async (req, res) => {
  const history = await trades.getHistory(100);
  res.json({ trades: history });
});

// ── GET /api/account — Alpaca account summary ─────────────────────────────
router.get('/api/account', async (req, res) => {
  const account = await trades.getAccount();
  res.json({ account });
});

// ── GET /api/stats ─────────────────────────────────────────────────────────
router.get('/api/stats', async (req, res) => {
  const stats = await trades.getStats();
  res.json(stats);
});

// ── POST /api/trade — manual order via Alpaca (trading still works manually) ──
router.post('/api/trade', async (req, res) => {
  const { symbol, action, positionId } = req.body;

  // Handle close by alpaca symbol directly (from positions panel)
  if (action === 'close' && positionId) {
    try {
      const result = await trades.closePosition(positionId, 'Manual close from dashboard');
      return res.json({ ok: true, action: 'closed', result });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  if (!symbol || !INSTRUMENTS.includes(symbol)) {
    return res.status(400).json({ error: `Invalid symbol. Use: ${INSTRUMENTS.join(', ')}` });
  }
  if (!['buy', 'sell', 'close'].includes(action)) {
    return res.status(400).json({ error: "action must be 'buy', 'sell', or 'close'" });
  }

  try {
    let result;
    if (action === 'buy') {
      result = await trades.openPosition(symbol, 'buy', 0, 'Manual buy from dashboard');
      res.json({ ok: true, action: 'buy order placed', result });
    } else if (action === 'sell') {
      result = await trades.openPosition(symbol, 'sell', 0, 'Manual sell from dashboard');
      res.json({ ok: true, action: 'sell order placed', result });
    } else if (action === 'close') {
      result = await trades.closePosition(symbol, 'Manual close from dashboard');
      res.json({ ok: true, action: 'position closed', result });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

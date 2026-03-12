/**
 * scheduler.js — ICT Analysis Scheduler
 * Runs every 5 minutes. Caches result globally for fast HTTP responses.
 * NO order execution — signals/analysis only.
 */

'use strict';

const cron = require('node-cron');
const { getAllSymbolsMultiTF, getLatestPrices, INSTRUMENTS } = require('./data');
const { analyzeSymbol } = require('./ict-engine');
const trades = require('./trades');

// ── Global cache ──────────────────────────────────────────────────────────
let cachedSnapshot = null;
let lastUpdated    = null;
let isRunning      = false;

function getSnapshot() {
  return cachedSnapshot;
}

function getLastUpdated() {
  return lastUpdated;
}

// ── Economic event check (stub — extend with real news feed) ──────────────
const HIGH_IMPACT_EVENTS = ['CPI', 'PPI', 'FOMC', 'NFP', 'Federal Reserve', 'Non-Farm'];

function checkNoTradeConditions(newsEvents = []) {
  const today = new Date().toDateString();
  const todayEvents = newsEvents.filter(e => new Date(e.date).toDateString() === today);
  const hasHighImpact = todayEvents.some(e =>
    HIGH_IMPACT_EVENTS.some(keyword => e.title && e.title.includes(keyword))
  );
  return hasHighImpact;
}

// ── Main analysis run ─────────────────────────────────────────────────────
async function runAnalysis() {
  if (isRunning) {
    console.log('[scheduler] Analysis already running, skipping...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  console.log('\n' + '═'.repeat(60));
  console.log(`[scheduler] ICT Analysis started at ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  try {
    // Fetch all multi-TF data and latest prices
    const [multiTFData, latestPrices] = await Promise.all([
      getAllSymbolsMultiTF(),
      getLatestPrices(),
    ]);

    // Fetch account/trade info
    const [positions, history, stats] = await Promise.all([
      trades.getPositions().catch(e => { console.warn('[scheduler] positions error:', e.message); return []; }),
      trades.getHistory(100).catch(e => { console.warn('[scheduler] history error:', e.message); return []; }),
      trades.getStats().catch(e => { console.warn('[scheduler] stats error:', e.message); return {}; }),
    ]);

    // Analyze each symbol
    const symbols = {};

    for (const symbol of INSTRUMENTS) {
      const tfData = multiTFData[symbol];
      const price  = latestPrices[symbol];

      if (!tfData || price === null || price === undefined) {
        console.warn(`[scheduler] Skipping ${symbol}: no data or price`);
        continue;
      }

      console.log(`\n[scheduler] ── ${symbol} (price: ${price}) ─────────────`);

      try {
        const analysis = analyzeSymbol(symbol, tfData, price);
        symbols[symbol] = analysis;

        // Detailed logging per timeframe
        const td = analysis.timeframeDetails;
        console.log(`  Daily  → ${td.daily.trend.padEnd(8)} | BOS: ${td.daily.lastBOS ? `${td.daily.lastBOS.direction} @ ${td.daily.lastBOS.level}` : 'none'}`);
        console.log(`  4H     → ${td.h4.trend.padEnd(8)} | BOS: ${td.h4.lastBOS ? `${td.h4.lastBOS.direction} @ ${td.h4.lastBOS.level}` : 'none'}`);
        console.log(`  1H     → ${td.h1.trend.padEnd(8)} | BOS: ${td.h1.lastBOS ? `${td.h1.lastBOS.direction} @ ${td.h1.lastBOS.level}` : 'none'}`);
        console.log(`  15m    → ${td.m15.trend.padEnd(8)} | BOS: ${td.m15.lastBOS ? `${td.m15.lastBOS.direction} @ ${td.m15.lastBOS.level}` : 'none'}`);
        console.log(`  Sweep  → ${analysis.liquiditySweep.detected ? `${analysis.liquiditySweep.side?.toUpperCase()} @ ${analysis.liquiditySweep.level}` : 'none'}`);
        console.log(`  OBs    → ${analysis.orderBlocks.length} active`);
        console.log(`  FVGs   → ${analysis.fvgs.length} unfilled`);
        console.log(`  Signal → ${analysis.signal.action} (${analysis.signal.confidence}/6) | ${analysis.signal.reason}`);

      } catch (err) {
        console.error(`[scheduler] analyzeSymbol error for ${symbol}:`, err.message);
      }
    }

    // No-trade check (stub)
    const newsEvents = [];
    const noTradeToday = checkNoTradeConditions(newsEvents);

    if (noTradeToday) {
      console.log('\n[scheduler] ⚠️  HIGH IMPACT NEWS EVENT — NO TRADE conditions active');
    }

    // Cache snapshot
    cachedSnapshot = {
      symbols,
      noTradeToday,
      newsEvents,
      account:   stats?.account || null,
      positions,
      trades:    history,
      stats: {
        totalTrades: stats?.totalTrades || 0,
        winRate:     stats?.winRate || 0,
        totalPnL:    stats?.totalPnL || 0,
        bestTrade:   stats?.bestTrade || 0,
        worstTrade:  stats?.worstTrade || 0,
      },
      snapshotAt: new Date().toISOString(),
    };

    lastUpdated = new Date();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n[scheduler] ✅ Analysis complete in ${elapsed}s at ${lastUpdated.toISOString()}`);
    console.log('═'.repeat(60) + '\n');

  } catch (err) {
    console.error('[scheduler] Fatal error in runAnalysis:', err.message, err.stack);
    // Keep cached snapshot on error — don't null it out
  } finally {
    isRunning = false;
  }
}

// ── Start scheduler ───────────────────────────────────────────────────────
function startScheduler() {
  console.log('[scheduler] ICT scheduler starting — runs every 5 minutes');
  console.log('[scheduler] Auto-trading: DISABLED (signals/analysis only)');

  // Run immediately on start
  runAnalysis().catch(err => console.error('[scheduler] Initial run error:', err.message));

  // Then every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    runAnalysis().catch(err => console.error('[scheduler] Cron run error:', err.message));
  });
}

module.exports = {
  startScheduler,
  getSnapshot,
  getLastUpdated,
};

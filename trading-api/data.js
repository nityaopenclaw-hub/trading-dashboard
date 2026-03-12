/**
 * data.js — Multi-Timeframe Data Fetching
 * Uses yahoo-finance2 chart() to fetch OHLCV data for multiple timeframes.
 *
 * Timeframes:
 *   - Daily  : 1d interval, 6 months
 *   - 4H     : resample from 1h (3 months), group every 4 candles
 *   - 1H     : 1h interval, 60 days
 *   - 15m    : 15m interval, 10 days
 */

'use strict';

const { default: YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const INSTRUMENTS = ['^GSPC', '^NDX'];

// ── Date helpers ──────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── Candle normalizer ─────────────────────────────────────────────────────
function normalizeCandles(quotes) {
  if (!quotes || !quotes.length) return [];
  return quotes
    .filter(q => q && q.open != null && q.close != null && q.high != null && q.low != null)
    .map(q => ({
      date:   q.date instanceof Date ? q.date.toISOString() : String(q.date),
      open:   parseFloat(q.open),
      high:   parseFloat(q.high),
      low:    parseFloat(q.low),
      close:  parseFloat(q.close),
      volume: parseFloat(q.volume || 0),
    }));
}

// ── Resample hourly → 4H ──────────────────────────────────────────────────
function resampleTo4H(hourlyCandles) {
  if (!hourlyCandles || !hourlyCandles.length) return [];

  const result = [];
  for (let i = 0; i < hourlyCandles.length; i += 4) {
    const chunk = hourlyCandles.slice(i, i + 4);
    if (chunk.length === 0) break;

    result.push({
      date:   chunk[0].date,
      open:   chunk[0].open,
      high:   Math.max(...chunk.map(c => c.high)),
      low:    Math.min(...chunk.map(c => c.low)),
      close:  chunk[chunk.length - 1].close,
      volume: chunk.reduce((s, c) => s + c.volume, 0),
    });
  }

  return result;
}

// ── Fetch single timeframe ─────────────────────────────────────────────────
async function fetchCandles(symbol, interval, period1, period2 = new Date()) {
  try {
    const result = await yahooFinance.chart(symbol, {
      interval,
      period1,
      period2,
    });

    const quotes = result?.quotes || [];
    return normalizeCandles(quotes);
  } catch (err) {
    console.error(`[data] fetchCandles error ${symbol} ${interval}:`, err.message);
    return [];
  }
}

// ── Fetch all timeframes for one symbol ───────────────────────────────────
async function fetchSymbolMultiTF(symbol) {
  const now = new Date();

  // Parallel fetches for the intervals we need
  const [dailyRaw, hourly3mRaw, hourly60dRaw, m15Raw] = await Promise.all([
    fetchCandles(symbol, '1d',  daysAgo(180), now),
    fetchCandles(symbol, '1h',  daysAgo(90),  now),
    fetchCandles(symbol, '1h',  daysAgo(60),  now),
    fetchCandles(symbol, '15m', daysAgo(10),  now),
  ]);

  return {
    daily: dailyRaw,
    h4:    resampleTo4H(hourly3mRaw),
    h1:    hourly60dRaw,
    m15:   m15Raw,
  };
}

// ── Fetch all symbols ─────────────────────────────────────────────────────
async function getAllSymbolsMultiTF() {
  const results = {};

  // Sequential to avoid rate limits
  for (const symbol of INSTRUMENTS) {
    console.log(`[data] Fetching multi-TF data for ${symbol}...`);
    results[symbol] = await fetchSymbolMultiTF(symbol);
    const { daily, h4, h1, m15 } = results[symbol];
    console.log(`[data] ${symbol}: daily=${daily.length} h4=${h4.length} h1=${h1.length} m15=${m15.length}`);
  }

  return results;
}

// ── Latest prices (for compatibility) ────────────────────────────────────
async function getLatestPrices() {
  const prices = {};
  for (const symbol of INSTRUMENTS) {
    try {
      const result = await yahooFinance.quote(symbol);
      prices[symbol] = result?.regularMarketPrice ?? null;
    } catch (err) {
      console.error(`[data] getLatestPrices error ${symbol}:`, err.message);
      prices[symbol] = null;
    }
  }
  return prices;
}

// ── Legacy: getAllOHLCV (for any lingering consumers) ─────────────────────
async function getAllOHLCV() {
  const multiTF = await getAllSymbolsMultiTF();
  const result = {};
  for (const [symbol, tfs] of Object.entries(multiTF)) {
    result[symbol] = tfs.h1; // return 1H as default
  }
  return result;
}

module.exports = {
  getAllSymbolsMultiTF,
  getAllOHLCV,
  getLatestPrices,
  INSTRUMENTS,
  resampleTo4H,
  normalizeCandles,
};

/**
 * ict-engine.js — ICT/TJR Smart Money Concepts Algorithm Engine
 * Pure functions only. No side effects, no I/O.
 *
 * Methodology:
 * - Market Structure via swing highs/lows (BOS uses candle CLOSE, not wick)
 * - Liquidity Sweeps (BSL/SSL)
 * - Order Blocks (from sweeps)
 * - Fair Value Gaps (3-candle imbalance)
 * - Equilibrium (50% midpoint of range)
 * - Multi-timeframe alignment scoring
 */

'use strict';

// ── Swing Detection ────────────────────────────────────────────────────────
/**
 * Detect swing highs and swing lows.
 * Swing HIGH: candle[i].high > all candles within `lookback` on each side.
 * Swing LOW:  candle[i].low  < all candles within `lookback` on each side.
 * NOTE: We use HIGH/LOW for the swing LEVEL, but BOS confirmation uses CLOSE.
 */
function detectSwings(candles, lookback = 3) {
  const highs = [];
  const lows = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i];

    // Swing High
    let isHigh = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= c.high || candles[i + j].high >= c.high) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) {
      highs.push({ index: i, price: c.high, date: c.date });
    }

    // Swing Low
    let isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].low <= c.low || candles[i + j].low <= c.low) {
        isLow = false;
        break;
      }
    }
    if (isLow) {
      lows.push({ index: i, price: c.low, date: c.date });
    }
  }

  return { highs, lows };
}

// ── Trend Detection ────────────────────────────────────────────────────────
/**
 * Determine trend direction from HH/HL (bullish) or LL/LH (bearish).
 * BOS is confirmed only when a candle CLOSE (body) breaches the most recent swing point.
 */
function detectTrend(candles, lookback = 3) {
  if (!candles || candles.length < lookback * 2 + 5) {
    return { direction: 'ranging', lastBOS: null, recentHigh: null, recentLow: null };
  }

  const swings = detectSwings(candles, lookback);
  const lastN = 5;

  const recentHighs = swings.highs.slice(-lastN);
  const recentLows  = swings.lows.slice(-lastN);

  const recentHigh = recentHighs.length ? recentHighs[recentHighs.length - 1].price : null;
  const recentLow  = recentLows.length  ? recentLows[recentLows.length - 1].price  : null;

  // Check BOS: candle CLOSE past most recent swing
  let lastBOS = null;
  const lastCandles = candles.slice(-20);

  if (recentHigh !== null) {
    for (let i = lastCandles.length - 1; i >= 0; i--) {
      if (lastCandles[i].close > recentHigh) {
        lastBOS = { direction: 'bullish', level: recentHigh, date: lastCandles[i].date };
        break;
      }
    }
  }
  if (!lastBOS && recentLow !== null) {
    for (let i = lastCandles.length - 1; i >= 0; i--) {
      if (lastCandles[i].close < recentLow) {
        lastBOS = { direction: 'bearish', level: recentLow, date: lastCandles[i].date };
        break;
      }
    }
  }

  // Determine HH/HL or LL/LH pattern
  let direction = 'ranging';

  if (recentHighs.length >= 2 && recentLows.length >= 2) {
    const hhCount = recentHighs.slice(-3).filter((h, i, arr) => i === 0 || h.price > arr[i - 1].price).length;
    const hlCount = recentLows.slice(-3).filter((l, i, arr) => i === 0 || l.price > arr[i - 1].price).length;
    const llCount = recentLows.slice(-3).filter((l, i, arr) => i === 0 || l.price < arr[i - 1].price).length;
    const lhCount = recentHighs.slice(-3).filter((h, i, arr) => i === 0 || h.price < arr[i - 1].price).length;

    const bullScore = hhCount + hlCount;
    const bearScore = llCount + lhCount;

    if (bullScore > bearScore && bullScore >= 3) direction = 'bullish';
    else if (bearScore > bullScore && bearScore >= 3) direction = 'bearish';
    else if (lastBOS) direction = lastBOS.direction;
  } else if (lastBOS) {
    direction = lastBOS.direction;
  }

  return { direction, lastBOS, recentHigh, recentLow };
}

// ── Liquidity Sweeps ───────────────────────────────────────────────────────
/**
 * Detect liquidity sweeps in the last 20 candles.
 * BSL sweep: candle wick pierces a swing high, but body CLOSES back BELOW it.
 * SSL sweep: candle wick pierces a swing low, but body CLOSES back ABOVE it.
 */
function detectLiquiditySweeps(candles, swings) {
  if (!candles || candles.length < 5) {
    return { detected: false, side: null, level: null, date: null };
  }

  const checkWindow = candles.slice(-20);
  const startIndex = candles.length - 20;

  // Gather all significant swing levels
  const swingHighLevels = swings.highs.map(h => h.price);
  const swingLowLevels  = swings.lows.map(l => l.price);

  for (let i = checkWindow.length - 1; i >= 0; i--) {
    const c = checkWindow[i];

    // BSL: wick above swing high, close back inside (below or equal to swing high)
    for (const level of swingHighLevels) {
      if (c.high > level && c.close <= level) {
        return { detected: true, side: 'bsl', level, date: c.date };
      }
    }

    // SSL: wick below swing low, close back inside (above or equal to swing low)
    for (const level of swingLowLevels) {
      if (c.low < level && c.close >= level) {
        return { detected: true, side: 'ssl', level, date: c.date };
      }
    }
  }

  return { detected: false, side: null, level: null, date: null };
}

// ── Fair Value Gaps ────────────────────────────────────────────────────────
/**
 * Detect Fair Value Gaps (3-candle imbalances).
 * Bullish FVG: candles[i].high < candles[i+2].low (gap between candle i top and candle i+2 bottom)
 * Bearish FVG: candles[i].low  > candles[i+2].high (gap between candle i bottom and candle i+2 top)
 * Mark filled=true if any subsequent candle overlaps the zone.
 */
function detectFVGs(candles) {
  if (!candles || candles.length < 3) return [];

  const fvgs = [];

  for (let i = 0; i < candles.length - 2; i++) {
    const c0 = candles[i];
    const c2 = candles[i + 2];

    // Bullish FVG: gap between top of c0 and bottom of c2
    if (c0.high < c2.low) {
      const fvgHigh = c2.low;
      const fvgLow  = c0.high;

      // Check if filled by any subsequent candle
      let filled = false;
      for (let j = i + 2; j < candles.length; j++) {
        if (candles[j].low <= fvgHigh && candles[j].high >= fvgLow) {
          filled = true;
          break;
        }
      }

      fvgs.push({ type: 'bullish', high: fvgHigh, low: fvgLow, date: candles[i + 1].date, filled });
    }

    // Bearish FVG: gap between bottom of c0 and top of c2
    if (c0.low > c2.high) {
      const fvgHigh = c0.low;
      const fvgLow  = c2.high;

      let filled = false;
      for (let j = i + 2; j < candles.length; j++) {
        if (candles[j].low <= fvgHigh && candles[j].high >= fvgLow) {
          filled = true;
          break;
        }
      }

      fvgs.push({ type: 'bearish', high: fvgHigh, low: fvgLow, date: candles[i + 1].date, filled });
    }
  }

  // Return last 10 unfilled FVGs
  return fvgs.filter(f => !f.filled).slice(-10);
}

// ── Order Blocks ───────────────────────────────────────────────────────────
/**
 * Detect Order Blocks: the price range of the move that CAUSED a liquidity sweep.
 * After a BSL sweep → look back for bearish OB (last bearish candle before sweep).
 * After a SSL sweep → look back for bullish OB (last bullish candle before sweep).
 */
function detectOrderBlocks(candles, recentSweep) {
  if (!candles || candles.length < 5) return [];
  if (!recentSweep || !recentSweep.detected) return [];

  const blocks = [];
  const lastN = Math.min(50, candles.length);
  const slice = candles.slice(-lastN);

  if (recentSweep.side === 'bsl') {
    // Bearish OB: find last bearish candle before the sweep level
    for (let i = slice.length - 2; i >= 0; i--) {
      const c = slice[i];
      if (c.close < c.open) { // bearish candle
        const isActive = candles[candles.length - 1].close >= c.low && candles[candles.length - 1].close <= c.high;
        blocks.push({ type: 'bearish', high: c.high, low: c.low, date: c.date, active: isActive });
        if (blocks.length >= 2) break;
      }
    }
  } else if (recentSweep.side === 'ssl') {
    // Bullish OB: find last bullish candle before the sweep level
    for (let i = slice.length - 2; i >= 0; i--) {
      const c = slice[i];
      if (c.close > c.open) { // bullish candle
        const isActive = candles[candles.length - 1].close >= c.low && candles[candles.length - 1].close <= c.high;
        blocks.push({ type: 'bullish', high: c.high, low: c.low, date: c.date, active: isActive });
        if (blocks.length >= 2) break;
      }
    }
  }

  return blocks;
}

// ── Equilibrium ────────────────────────────────────────────────────────────
/**
 * Calc equilibrium (50% midpoint of swing range).
 * Discount zone: price below midpoint → quality longs in uptrend.
 * Premium zone:  price above midpoint → quality shorts in downtrend.
 */
function calcEquilibrium(recentHigh, recentLow, currentPrice) {
  if (recentHigh === null || recentLow === null) {
    return { midpoint: null, pricePosition: 'unknown' };
  }

  const midpoint = (recentHigh + recentLow) / 2;
  const threshold = (recentHigh - recentLow) * 0.05; // 5% band around midpoint

  let pricePosition;
  if (currentPrice < midpoint - threshold) pricePosition = 'discount';
  else if (currentPrice > midpoint + threshold) pricePosition = 'premium';
  else pricePosition = 'at_equilibrium';

  return { midpoint: parseFloat(midpoint.toFixed(2)), pricePosition };
}

// ── Single Timeframe Analysis ──────────────────────────────────────────────
/**
 * Run all ICT detections on a single timeframe's candles.
 */
function analyzeTimeframe(candles, timeframe, currentPrice) {
  if (!candles || candles.length < 10) {
    return {
      timeframe,
      trend: { direction: 'ranging', lastBOS: null, recentHigh: null, recentLow: null },
      swings: { highs: [], lows: [] },
      fvgs: [],
      orderBlocks: [],
      recentSweep: { detected: false, side: null, level: null, date: null },
      equilibrium: { midpoint: null, pricePosition: 'unknown' },
    };
  }

  const trend      = detectTrend(candles);
  const swings     = detectSwings(candles);
  const recentSweep = detectLiquiditySweeps(candles, swings);
  const fvgs       = detectFVGs(candles);
  const orderBlocks = detectOrderBlocks(candles, recentSweep);
  const equilibrium = calcEquilibrium(trend.recentHigh, trend.recentLow, currentPrice);

  return { timeframe, trend, swings, fvgs, orderBlocks, recentSweep, equilibrium };
}

// ── Symbol Names & Alpaca Mapping ──────────────────────────────────────────
const SYMBOL_NAMES = {
  '^GSPC': 'S&P 500',
  '^NDX':  'NASDAQ 100',
  'GC=F':  'Gold',
};

const ALPACA_SYMBOLS = {
  '^GSPC': 'SPY',
  '^NDX':  'QQQ',
  'GC=F':  'GLD',
};

// ── Multi-Symbol Full Analysis ─────────────────────────────────────────────
/**
 * Analyze a symbol across all 4 timeframes.
 * Computes alignment, confidence score, and final signal.
 *
 * Confidence scoring (0-6):
 * 1. Daily trend confirmed (not ranging)
 * 2. 4H aligns with Daily
 * 3. Recent liquidity sweep on 4H or 1H (within last 5 candles)
 * 4. BOS confirmed on 1H or 15m in daily bias direction
 * 5. Price currently within an active OB or FVG on any TF
 * 6. 15m trend aligns with daily bias (LTF confirmation)
 */
function analyzeSymbol(symbol, multiTFData, currentPrice) {
  const { daily, h4, h1, m15 } = multiTFData;

  const dailyAnalysis = analyzeTimeframe(daily, 'daily', currentPrice);
  const h4Analysis    = analyzeTimeframe(h4,    '4H',    currentPrice);
  const h1Analysis    = analyzeTimeframe(h1,    '1H',    currentPrice);
  const m15Analysis   = analyzeTimeframe(m15,   '15m',   currentPrice);

  const dailyBias = dailyAnalysis.trend.direction;

  const tfAlignment = {
    daily: dailyAnalysis.trend.direction,
    h4:    h4Analysis.trend.direction,
    h1:    h1Analysis.trend.direction,
    m15:   m15Analysis.trend.direction,
  };

  const alignedCount = Object.values(tfAlignment).filter(d => d === dailyBias && d !== 'ranging').length;
  const allAligned   = alignedCount === 4 && dailyBias !== 'ranging';

  // ── Confidence Scoring ────────────────────────────────────────────────────
  const confluences        = [];
  const missingConfluences = [];

  // 1. Daily trend confirmed
  if (dailyBias !== 'ranging') {
    confluences.push('htf_' + dailyBias + '_confirmed');
  } else {
    missingConfluences.push('daily_trend_ranging');
  }

  // 2. 4H aligns with Daily
  if (tfAlignment.h4 === dailyBias && dailyBias !== 'ranging') {
    confluences.push('h4_aligned');
  } else {
    missingConfluences.push('h4_not_aligned');
  }

  // 3. Recent liquidity sweep on 4H or 1H
  const sweepDetected = h4Analysis.recentSweep.detected || h1Analysis.recentSweep.detected;
  if (sweepDetected) {
    const sweepSide = h4Analysis.recentSweep.detected
      ? h4Analysis.recentSweep.side
      : h1Analysis.recentSweep.side;
    confluences.push('liquidity_sweep_' + sweepSide);
  } else {
    missingConfluences.push('liquidity_sweep');
  }

  // 4. BOS confirmed on 1H or 15m in daily bias direction
  const h1BOS  = h1Analysis.trend.lastBOS;
  const m15BOS = m15Analysis.trend.lastBOS;
  const bosConfirmed = (h1BOS && h1BOS.direction === dailyBias) ||
                       (m15BOS && m15BOS.direction === dailyBias);
  if (bosConfirmed) {
    confluences.push('bos_confirmed');
  } else {
    missingConfluences.push('bos_confirmed');
  }

  // 5. Price within active OB or FVG
  const allOBs = [
    ...dailyAnalysis.orderBlocks.map(ob => ({ ...ob, timeframe: 'daily' })),
    ...h4Analysis.orderBlocks.map(ob => ({ ...ob, timeframe: '4H' })),
    ...h1Analysis.orderBlocks.map(ob => ({ ...ob, timeframe: '1H' })),
    ...m15Analysis.orderBlocks.map(ob => ({ ...ob, timeframe: '15m' })),
  ];
  const allFVGs = [
    ...dailyAnalysis.fvgs.map(f => ({ ...f, timeframe: 'daily' })),
    ...h4Analysis.fvgs.map(f => ({ ...f, timeframe: '4H' })),
    ...h1Analysis.fvgs.map(f => ({ ...f, timeframe: '1H' })),
    ...m15Analysis.fvgs.map(f => ({ ...f, timeframe: '15m' })),
  ];

  const inOB  = allOBs.some(ob => ob.active && currentPrice >= ob.low && currentPrice <= ob.high);
  const inFVG = allFVGs.some(fvg => !fvg.filled && currentPrice >= fvg.low && currentPrice <= fvg.high);

  if (inOB || inFVG) {
    confluences.push('in_ob_or_fvg');
  } else {
    missingConfluences.push('in_ob_or_fvg');
  }

  // 6. 15m trend aligns with daily bias
  if (tfAlignment.m15 === dailyBias && dailyBias !== 'ranging') {
    confluences.push('ltf_bos');
  } else {
    missingConfluences.push('ltf_bos');
  }

  const confidence = confluences.length;

  // ── Determine Action ──────────────────────────────────────────────────────
  let action = 'HOLD';
  if (confidence >= 5 && dailyBias === 'bullish') action = 'BUY';
  else if (confidence >= 5 && dailyBias === 'bearish') action = 'SELL';

  // ── Build Entry/Stop/TP levels ────────────────────────────────────────────
  let entryZone = null;
  let stopLevel = null;
  let tp1       = null;

  if (action !== 'HOLD') {
    // Best active OB or FVG in direction
    const bias = dailyBias;
    const relevantOBs  = allOBs.filter(ob => ob.type === bias && ob.active);
    const relevantFVGs = allFVGs.filter(fvg => fvg.type === bias && !fvg.filled);

    if (relevantOBs.length) {
      const ob = relevantOBs[relevantOBs.length - 1];
      entryZone = { low: ob.low, high: ob.high };
      stopLevel = bias === 'bullish' ? ob.low * 0.998 : ob.high * 1.002;
    } else if (relevantFVGs.length) {
      const fvg = relevantFVGs[relevantFVGs.length - 1];
      entryZone = { low: fvg.low, high: fvg.high };
      stopLevel = bias === 'bullish' ? fvg.low * 0.998 : fvg.high * 1.002;
    }

    if (entryZone && dailyAnalysis.trend.recentHigh && dailyAnalysis.trend.recentLow) {
      const range = dailyAnalysis.trend.recentHigh - dailyAnalysis.trend.recentLow;
      tp1 = bias === 'bullish'
        ? parseFloat((currentPrice + range * 0.5).toFixed(2))
        : parseFloat((currentPrice - range * 0.5).toFixed(2));
    }
  }

  // ── Build reason string ───────────────────────────────────────────────────
  let reason = '';
  if (action === 'HOLD') {
    if (dailyBias === 'ranging') reason = 'Market is consolidating — no clear directional bias.';
    else reason = `${dailyBias.toUpperCase()} bias but only ${confidence}/6 confluences. Missing: ${missingConfluences.join(', ')}.`;
  } else {
    reason = `${action} signal: ${confidence}/6 confluences aligned. ${confluences.join(', ')}.`;
  }

  // ── Build best structural data for response ───────────────────────────────
  const bestBOS = h1Analysis.trend.lastBOS || m15Analysis.trend.lastBOS || dailyAnalysis.trend.lastBOS;
  const equil   = dailyAnalysis.equilibrium;

  return {
    name:         SYMBOL_NAMES[symbol] || symbol,
    alpacaSymbol: ALPACA_SYMBOLS[symbol] || symbol,
    price:        currentPrice,
    trend: {
      direction:    dailyBias,
      dailyBias,
      tfAlignment,
      allAligned,
      alignedCount,
    },
    structure: {
      lastBOS:       bestBOS,
      recentHigh:    dailyAnalysis.trend.recentHigh,
      recentLow:     dailyAnalysis.trend.recentLow,
      equilibrium:   equil.midpoint,
      pricePosition: equil.pricePosition,
    },
    orderBlocks: allOBs.filter(ob => ob.active).slice(-5),
    fvgs:        allFVGs.filter(f => !f.filled).slice(-5),
    liquiditySweep: h4Analysis.recentSweep.detected
      ? h4Analysis.recentSweep
      : h1Analysis.recentSweep,
    signal: {
      action,
      confidence,
      maxConfidence: 6,
      confluences,
      missingConfluences,
      reason,
      entryZone,
      stopLevel:  stopLevel ? parseFloat(stopLevel.toFixed(2)) : null,
      tp1,
    },
    timeframeDetails: {
      daily: { trend: dailyAnalysis.trend.direction, lastBOS: dailyAnalysis.trend.lastBOS },
      h4:    { trend: h4Analysis.trend.direction,    lastBOS: h4Analysis.trend.lastBOS    },
      h1:    { trend: h1Analysis.trend.direction,    lastBOS: h1Analysis.trend.lastBOS    },
      m15:   { trend: m15Analysis.trend.direction,   lastBOS: m15Analysis.trend.lastBOS   },
    },
    computedAt: new Date().toISOString(),
  };
}

module.exports = {
  detectSwings,
  detectTrend,
  detectLiquiditySweeps,
  detectFVGs,
  detectOrderBlocks,
  calcEquilibrium,
  analyzeTimeframe,
  analyzeSymbol,
  SYMBOL_NAMES,
  ALPACA_SYMBOLS,
};

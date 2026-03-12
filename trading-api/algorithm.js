/**
 * algorithm.js — Legacy shim
 * The real algorithm is now in ict-engine.js.
 * This file exists only for backward compatibility with any stale imports.
 */
'use strict';

const { analyzeSymbol } = require('./ict-engine');

// Legacy stub — not used by the new ICT system
function computeSignal(closes) {
  return {
    action: 'HOLD',
    confidence: 0,
    reason: 'Use ICT engine via scheduler snapshot',
  };
}

module.exports = { computeSignal };

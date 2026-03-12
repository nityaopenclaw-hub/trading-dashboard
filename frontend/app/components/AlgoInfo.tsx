'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function AlgoInfo() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid #1e2433', background: '#0d1117' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
        style={{ background: '#0d1117' }}
      >
        <span>📊 Algorithm Info</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {open && (
        <div
          className="px-4 pb-4"
          style={{ borderTop: '1px solid #1e2433' }}
        >
          <pre
            className="text-xs leading-relaxed mt-3 whitespace-pre-wrap"
            style={{ color: '#94a3b8', fontFamily: 'monospace' }}
          >
{`📊 Algorithm v1 — Technical Momentum
Strategy: EMA 20/50 Crossover + RSI Filter + MACD Confirmation
Entry:    Buy when EMA20 crosses above EMA50, RSI < 70, MACD bullish
Exit:     Sell when EMA20 crosses below EMA50, OR stop loss -2%, OR take profit +4%
Instruments: S&P 500, NASDAQ 100, Gold (paper trading only)
Status:   Learning & improving — logic will be updated as new strategies are added`}
          </pre>
        </div>
      )}
    </div>
  );
}

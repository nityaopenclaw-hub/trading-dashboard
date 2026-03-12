'use client';

import { Signal } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SignalsPanelProps {
  signals: Signal[];
}

function SignalBadge({ action }: { action: Signal['action'] }) {
  const styles = {
    BUY: { bg: '#00ff8820', color: '#00ff88', border: '#00ff8840' },
    SELL: { bg: '#ff444420', color: '#ff4444', border: '#ff444440' },
    HOLD: { bg: '#88888820', color: '#888888', border: '#88888840' },
  };
  const s = styles[action];
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {action}
    </span>
  );
}

function TrendIcon({ trend }: { trend: Signal['trend'] }) {
  if (trend === 'bullish') return <TrendingUp size={16} style={{ color: '#00ff88' }} />;
  if (trend === 'bearish') return <TrendingDown size={16} style={{ color: '#ff4444' }} />;
  return <Minus size={16} style={{ color: '#888' }} />;
}

export default function SignalsPanel({ signals }: SignalsPanelProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#e2e8f0' }}>
        🎯 Algorithm Signals
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {signals.map((signal) => (
          <div
            key={signal.symbol}
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: '#0d1117', border: '1px solid #1e2433' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">{signal.symbol}</div>
                <div className="text-sm font-semibold text-gray-300">{signal.name}</div>
              </div>
              <SignalBadge action={signal.action} />
            </div>

            {/* Price + Trend */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-white">
                ${signal.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <TrendIcon trend={signal.trend} />
            </div>

            {/* Indicators */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">EMA20</span>
                <span className="font-mono text-gray-300">
                  {signal.ema20.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">EMA50</span>
                <span className="font-mono text-gray-300">
                  {signal.ema50.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RSI</span>
                <span
                  className="font-mono"
                  style={{
                    color: signal.rsi > 70 ? '#ff4444' : signal.rsi < 30 ? '#00ff88' : '#e2e8f0',
                  }}
                >
                  {signal.rsi.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">MACD</span>
                <span
                  className="font-mono"
                  style={{ color: signal.macd >= 0 ? '#00ff88' : '#ff4444' }}
                >
                  {signal.macd.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div
              className="text-xs rounded px-2 py-1.5"
              style={{ background: '#0a0a0f', color: '#94a3b8', border: '1px solid #1e2433' }}
            >
              {signal.reason}
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-600">
              Computed at {new Date(signal.computedAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

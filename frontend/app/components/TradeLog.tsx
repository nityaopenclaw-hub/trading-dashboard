'use client';

import { Trade } from '../types';

interface TradeLogProps {
  trades: Trade[];
}

export default function TradeLog({ trades }: TradeLogProps) {
  const sorted = [...trades].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 50);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#e2e8f0' }}>
        📋 Trade Log
      </h2>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid #1e2433', background: '#0d1117' }}
      >
        {/* Header row */}
        <div
          className="grid text-xs font-semibold uppercase tracking-wider text-gray-500 px-4 py-3"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
            borderBottom: '1px solid #1e2433',
          }}
        >
          <div>Date / Time</div>
          <div>Symbol</div>
          <div>Side</div>
          <div className="text-right">Entry</div>
          <div className="text-right">Exit</div>
          <div className="text-right">P&amp;L</div>
          <div className="text-right">P&amp;L%</div>
          <div className="text-center">Status</div>
        </div>

        {/* Rows */}
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-600">
            No trades yet
          </div>
        ) : (
          sorted.map((trade, i) => {
            const isWin = trade.status === 'WIN';
            return (
              <div
                key={trade.id}
                className="grid items-center px-4 py-3 text-xs"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
                  background: i % 2 === 0 ? '#0d1117' : '#0a0a0f',
                  borderBottom: '1px solid #1e243366',
                  borderLeft: `2px solid ${isWin ? '#00ff8840' : '#ff444440'}`,
                }}
              >
                <div className="font-mono text-gray-400">
                  {new Date(trade.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="font-semibold text-gray-200">{trade.symbol}</div>
                <div>
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-bold"
                    style={{
                      background: trade.side === 'LONG' ? '#00ff8815' : '#ff444415',
                      color: trade.side === 'LONG' ? '#00ff88' : '#ff4444',
                    }}
                  >
                    {trade.side}
                  </span>
                </div>
                <div className="font-mono text-right text-gray-300">
                  ${trade.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="font-mono text-right text-gray-300">
                  ${trade.exitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div
                  className="font-mono text-right font-semibold"
                  style={{ color: isWin ? '#00ff88' : '#ff4444' }}
                >
                  {isWin ? '+' : ''}${trade.pnl.toFixed(2)}
                </div>
                <div
                  className="font-mono text-right"
                  style={{ color: isWin ? '#00ff8899' : '#ff444499' }}
                >
                  {isWin ? '+' : ''}{trade.pnlPct.toFixed(2)}%
                </div>
                <div className="flex justify-center">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: isWin ? '#00ff8820' : '#ff444420',
                      color: isWin ? '#00ff88' : '#ff4444',
                      border: `1px solid ${isWin ? '#00ff8840' : '#ff444440'}`,
                    }}
                  >
                    {trade.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

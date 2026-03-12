'use client';

import { Position } from '../types';
import { useState } from 'react';

interface PositionsPanelProps {
  positions: Position[];
  onClose: (id: string) => Promise<void>;
}

function formatDuration(openedAt: string): string {
  const ms = Date.now() - new Date(openedAt).getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

export default function PositionsPanel({ positions, onClose }: PositionsPanelProps) {
  const [closing, setClosing] = useState<string | null>(null);

  const handleClose = async (id: string) => {
    setClosing(id);
    try {
      await onClose(id);
    } finally {
      setClosing(null);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#e2e8f0' }}>
        📂 Open Positions
      </h2>

      {positions.length === 0 ? (
        <div
          className="rounded-xl p-6 text-center text-sm"
          style={{ background: '#0d1117', border: '1px solid #1e2433', color: '#64748b' }}
        >
          No open positions — watching for signals
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {positions.map((pos) => {
            const isProfitable = pos.pnl >= 0;
            return (
              <div
                key={pos.id}
                className="rounded-xl p-4"
                style={{ background: '#0d1117', border: '1px solid #1e2433' }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left: symbol/side */}
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold text-white">{pos.symbol}</div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{
                          background: pos.side === 'LONG' ? '#00ff8820' : '#ff444420',
                          color: pos.side === 'LONG' ? '#00ff88' : '#ff4444',
                          border: `1px solid ${pos.side === 'LONG' ? '#00ff8840' : '#ff444440'}`,
                        }}
                      >
                        {pos.side}
                      </span>
                    </div>
                  </div>

                  {/* Center: prices */}
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <span className="text-gray-400">
                      ${pos.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-gray-600">→</span>
                    <span className="text-white">
                      ${pos.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* P&L */}
                  <div className="text-right">
                    <div
                      className="font-mono font-bold text-sm"
                      style={{ color: isProfitable ? '#00ff88' : '#ff4444' }}
                    >
                      {isProfitable ? '+' : ''}${pos.pnl.toFixed(2)}
                    </div>
                    <div
                      className="font-mono text-xs"
                      style={{ color: isProfitable ? '#00ff8899' : '#ff444499' }}
                    >
                      {isProfitable ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                    </div>
                  </div>

                  {/* Time held */}
                  <div className="text-xs text-gray-500">
                    ⏱ {formatDuration(pos.openedAt)}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => handleClose(pos.id)}
                    disabled={closing === pos.id}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity disabled:opacity-50"
                    style={{
                      background: '#ff444420',
                      color: '#ff4444',
                      border: '1px solid #ff444440',
                    }}
                  >
                    {closing === pos.id ? 'Closing...' : 'Close Position'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

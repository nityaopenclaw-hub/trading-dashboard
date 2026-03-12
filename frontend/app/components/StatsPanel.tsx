'use client';

import { Stats } from '../types';

interface StatsPanelProps {
  stats: Stats;
}

interface StatCardProps {
  label: string;
  value: string;
  color?: string;
  emoji: string;
}

function StatCard({ label, value, color, emoji }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: '#0d1117', border: '1px solid #1e2433' }}
    >
      <div className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
        <span>{emoji}</span> {label}
      </div>
      <div
        className="font-mono text-2xl font-bold"
        style={{ color: color || '#e2e8f0' }}
      >
        {value}
      </div>
    </div>
  );
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  const pnlColor = stats.totalPnl >= 0 ? '#00ff88' : '#ff4444';
  const bestColor = stats.bestTrade >= 0 ? '#00ff88' : '#ff4444';
  const winRateColor = stats.winRate >= 50 ? '#00ff88' : '#ff4444';

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#e2e8f0' }}>
        📊 Performance Stats
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          emoji="🎯"
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          color={winRateColor}
        />
        <StatCard
          emoji="💰"
          label="Total P&L"
          value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
          color={pnlColor}
        />
        <StatCard
          emoji="🔢"
          label="Total Trades"
          value={String(stats.totalTrades)}
        />
        <StatCard
          emoji="🏆"
          label="Best Trade"
          value={`${stats.bestTrade >= 0 ? '+' : ''}$${stats.bestTrade.toFixed(2)}`}
          color={bestColor}
        />
      </div>
    </div>
  );
}

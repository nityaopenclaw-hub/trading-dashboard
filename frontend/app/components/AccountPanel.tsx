'use client';

import { Account } from '../types';
interface Props { account: Account | null | undefined; }

export default function AccountPanel({ account }: Props) {
  if (!account) {
    return (
      <div style={{ background: '#0d1117', border: '1px solid #1e2433', borderRadius: 8, padding: '16px 20px' }}>
        <p style={{ color: '#666', fontSize: 13, margin: 0 }}>Alpaca account not connected</p>
      </div>
    );
  }

  const pnlColor = account.totalPnl >= 0 ? '#00ff88' : '#ff4444';
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <h2 style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 600, margin: 0 }}>🏦 Alpaca Paper Account</h2>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#00ff8820', color: '#00ff88', border: '1px solid #00ff8840', fontWeight: 600 }}>
          {account.status}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Portfolio Value', value: fmt(account.portfolioValue), color: '#e2e8f0' },
          { label: 'Cash', value: fmt(account.cash), color: '#e2e8f0' },
          { label: 'Buying Power', value: fmt(account.buyingPower), color: '#e2e8f0' },
          { label: 'Total P&L', value: (account.totalPnl >= 0 ? '+' : '') + fmt(account.totalPnl), color: pnlColor },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#0d1117', border: '1px solid #1e2433', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ color: '#666', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

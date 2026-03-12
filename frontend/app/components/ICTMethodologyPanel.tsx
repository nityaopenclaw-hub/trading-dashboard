'use client';

import { useState } from 'react';

const CONFLUENCES = [
  {
    key: 'htf_trend',
    label: 'HTF Trend Confirmed',
    desc: 'Daily and 4H are aligned in the same direction. This is your macro bias — only trade in this direction.',
  },
  {
    key: 'h4_aligned',
    label: '4H Aligned with Daily',
    desc: '4H structure confirms daily direction. Confluence of two higher timeframes is required before entering.',
  },
  {
    key: 'liquidity_sweep',
    label: 'Liquidity Sweep Detected',
    desc: 'Price has swept buy-side or sell-side liquidity (inducement). Smart money needs to hunt stops before reversing.',
  },
  {
    key: 'bos',
    label: 'BOS Confirmed',
    desc: 'Break of Structure on the trading timeframe confirms institutional order flow in the bias direction.',
  },
  {
    key: 'ob_or_fvg',
    label: 'Price in OB or FVG Zone',
    desc: 'Price is trading inside an active Order Block or Fair Value Gap — premium/discount zone where institutions enter.',
  },
  {
    key: 'ltf_bos',
    label: 'LTF BOS Confirmed',
    desc: 'Lower timeframe (15m) shows a break of structure confirming entry timing within the zone.',
  },
];

export default function ICTMethodologyPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section>
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          background: '#0d1117',
          border: '1px solid #1e2433',
          borderRadius: 12,
          padding: '14px 20px',
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#e2e8f0',
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        <span>📚 ICT Methodology Reference</span>
        <span style={{ color: '#94a3b8', fontSize: 18 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div
          style={{
            background: '#0d1117',
            border: '1px solid #1e2433',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            padding: 20,
          }}
        >
          {/* Confluences */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              6 Required Confluences
            </div>
            {CONFLUENCES.map((c, i) => (
              <div key={c.key} style={{ marginBottom: 12, paddingLeft: 8, borderLeft: '2px solid #1e2433' }}>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                  {i + 1}. {c.label}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>

          {/* No trade conditions */}
          <div
            style={{
              background: '#1a0f0f',
              border: '1px solid #ff444430',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{ color: '#ff4444', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              🚫 No Trade Conditions
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
              CPI / PPI / FOMC / NFP news days &bull; Asian session &bull; Ranging or choppy markets &bull;
              Less than 4 confluences met &bull; Outside NY Open (first 1.5h) or London session
            </div>
          </div>

          {/* Risk management */}
          <div
            style={{
              background: '#0f1a10',
              border: '1px solid #00ff8830',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{ color: '#00ff88', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              📏 Risk Management
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
              Risk 1–3% of account per trade &bull; Stop loss placed below sweep low (for longs) or above sweep high (for shorts) &bull;
              Minimum 1:2 Risk-to-Reward ratio &bull; Scale out at TP1 (50%), trail remainder
            </div>
          </div>

          {/* Sessions */}
          <div
            style={{
              background: '#0f1218',
              border: '1px solid #fbbf2430',
              borderRadius: 8,
              padding: '12px 16px',
            }}
          >
            <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              ⏰ Trading Sessions
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>
              <strong style={{ color: '#e2e8f0' }}>NY Open:</strong> 9:30 – 11:00 AM ET (first 1.5 hours) &bull;{' '}
              <strong style={{ color: '#e2e8f0' }}>London Session:</strong> 2:00 – 5:00 AM ET &bull;{' '}
              <strong style={{ color: '#e2e8f0' }}>Avoid:</strong> Asian session (ranging), NFP Fridays
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

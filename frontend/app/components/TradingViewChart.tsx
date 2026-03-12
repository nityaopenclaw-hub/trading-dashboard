'use client';

import { useState } from 'react';

interface TradingViewChartProps {
  symbol: string;
  name: string;
}

const INTERVALS = [
  { label: 'Daily', value: 'D' },
  { label: '4H',    value: '240' },
  { label: '1H',    value: '60' },
  { label: '15m',   value: '15' },
] as const;

type IntervalValue = typeof INTERVALS[number]['value'];

export default function TradingViewChart({ symbol, name }: TradingViewChartProps) {
  const [interval, setInterval] = useState<IntervalValue>('D');

  const src =
    `https://www.tradingview.com/widgetembed/` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${interval}` +
    `&theme=dark` +
    `&style=1` +
    `&locale=en` +
    `&hide_top_toolbar=0` +
    `&hide_side_toolbar=0` +
    `&allow_symbol_change=0` +
    `&save_image=0` +
    `&calendar=0` +
    `&studies=%5B%5D` +
    `&utm_source=trading-dashboard`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <style>{`
        .tv-chart-wrapper {
          height: 700px;
          overflow: hidden;
          border-top: 1px solid #1e2433;
          border-bottom: 1px solid #1e2433;
        }
        @media (max-width: 767px) {
          .tv-chart-wrapper {
            height: 380px;
          }
        }
      `}</style>

      {/* Title + interval switcher row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4 }}>
        <h3 style={{
          color: '#94a3b8', fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 1.5,
          margin: 0,
        }}>
          {name}
        </h3>

        <div style={{ display: 'flex', gap: 4 }}>
          {INTERVALS.map(({ label, value }) => {
            const selected = interval === value;
            return (
              <button
                key={value}
                onClick={() => setInterval(value)}
                style={{
                  background: selected ? '#3b82f6' : '#0f1629',
                  color: selected ? '#ffffff' : '#94a3b8',
                  border: '1px solid ' + (selected ? '#3b82f6' : '#1e2433'),
                  borderRadius: 9999,
                  padding: '2px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  lineHeight: '18px',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="tv-chart-wrapper">
        <iframe
          key={`${symbol}-${interval}`}
          src={src}
          width="100%"
          height="100%"
          frameBorder="0"
          allowTransparency={true}
          scrolling="no"
          allowFullScreen
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}

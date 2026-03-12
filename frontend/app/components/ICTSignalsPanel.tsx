'use client';

import { ICTSnapshot, ICTSymbol, TFAlignment } from '../types';

interface Props {
  snapshot: ICTSnapshot | null;
}

const CONFLUENCE_KEYS = [
  { key: 'htf_bearish_confirmed', label: 'HTF Trend Confirmed', altKey: 'htf_bullish_confirmed' },
  { key: 'h4_aligned', label: '4H Aligned with Daily', altKey: 'h4_aligned_with_daily' },
  { key: 'liquidity_sweep', label: 'Liquidity Sweep Detected' },
  { key: 'bos_confirmed', label: 'BOS Confirmed' },
  { key: 'in_ob_or_fvg', label: 'Price in OB or FVG Zone', altKey: 'price_in_ob_or_fvg' },
  { key: 'ltf_bos', label: 'LTF BOS Confirmed', altKey: 'ltf_bos_confirmed' },
];

function hasConfluence(confluences: string[], key: string, altKey?: string): boolean {
  const lower = confluences.map((c) => c.toLowerCase());
  if (lower.includes(key.toLowerCase())) return true;
  if (altKey && lower.includes(altKey.toLowerCase())) return true;
  // fuzzy match: check if any confluence includes the key substring
  return lower.some((c) => c.includes(key.toLowerCase().replace(/_/g, '')) || key.toLowerCase().split('_').some((part) => part.length > 3 && c.includes(part)));
}

function getConfluenceColor(confidence: number, max: number): string {
  const ratio = max > 0 ? confidence / max : 0;
  if (ratio <= 0.33) return '#ff4444';
  if (ratio <= 0.66) return '#fbbf24';
  return '#00ff88';
}

function tfArrow(value: string): { symbol: string; color: string } {
  const v = value?.toLowerCase() || '';
  if (v === 'bullish' || v === 'bull') return { symbol: '↑', color: '#00ff88' };
  if (v === 'bearish' || v === 'bear') return { symbol: '↓', color: '#ff4444' };
  return { symbol: '—', color: '#888' };
}

function signalBadge(action: string) {
  const bg: Record<string, string> = { BUY: '#00ff8820', SELL: '#ff444420', HOLD: '#88888820' };
  const color: Record<string, string> = { BUY: '#00ff88', SELL: '#ff4444', HOLD: '#888' };
  const border: Record<string, string> = { BUY: '#00ff8850', SELL: '#ff444450', HOLD: '#88888850' };
  const a = (action || 'HOLD').toUpperCase();
  return (
    <span
      style={{
        background: bg[a] || bg.HOLD,
        color: color[a] || color.HOLD,
        border: `1px solid ${border[a] || border.HOLD}`,
        padding: '2px 10px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 1,
      }}
    >
      {a}
    </span>
  );
}

function biasBadge(bias: string) {
  const b = (bias || '').toLowerCase();
  if (b === 'bullish') return <span style={{ color: '#00ff88', fontWeight: 600 }}>🟢 BULLISH</span>;
  if (b === 'bearish') return <span style={{ color: '#ff4444', fontWeight: 600 }}>🔴 BEARISH</span>;
  return <span style={{ color: '#888', fontWeight: 600 }}>⚪ RANGING</span>;
}

function TFAlignmentRow({ tf }: { tf: TFAlignment }) {
  const cells = [
    { label: 'Daily', val: tf?.daily },
    { label: '4H', val: tf?.h4 },
    { label: '1H', val: tf?.h1 },
    { label: '15m', val: tf?.m15 },
  ];
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {cells.map(({ label, val }) => {
        const arrow = tfArrow(val || '');
        return (
          <div
            key={label}
            style={{
              background: '#161b2e',
              border: '1px solid #1e2433',
              borderRadius: 6,
              padding: '4px 10px',
              textAlign: 'center',
              minWidth: 52,
            }}
          >
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 16, color: arrow.color, fontWeight: 700 }}>{arrow.symbol}</div>
          </div>
        );
      })}
    </div>
  );
}

function SymbolCard({ symbolKey, sym }: { symbolKey: string; sym: ICTSymbol }) {
  const signal = sym.signal || ({} as any);
  const confidence = signal.confidence ?? 0;
  const maxConf = signal.maxConfidence ?? 6;
  const action = signal.action || 'HOLD';
  const confluences: string[] = signal.confluences || [];
  const barColor = getConfluenceColor(confidence, maxConf);
  const barPct = maxConf > 0 ? (confidence / maxConf) * 100 : 0;

  return (
    <div
      style={{
        background: '#0d1117',
        border: '1px solid #1e2433',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16 }}>{sym.name || symbolKey}</span>
          <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>({sym.alpacaSymbol || symbolKey})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 17, color: '#e2e8f0', fontWeight: 600 }}>
            ${(sym.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {signalBadge(action)}
        </div>
      </div>

      {/* Daily Bias */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ color: '#94a3b8', fontSize: 12, minWidth: 80 }}>Daily Bias:</span>
        {biasBadge(sym.trend?.dailyBias || sym.trend?.direction || '')}
      </div>

      {/* TF Alignment */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Timeframe Alignment</div>
        <TFAlignmentRow tf={sym.trend?.tfAlignment || { daily: '', h4: '', h1: '', m15: '' }} />
      </div>

      {/* Confluence score + progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>Confluence Score</span>
          <span style={{ color: barColor, fontWeight: 700, fontSize: 13 }}>{confidence} / {maxConf}</span>
        </div>
        <div style={{ background: '#1e2433', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div
            style={{
              width: `${barPct}%`,
              height: '100%',
              background: barColor,
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Confluence checklist */}
      <div style={{ marginBottom: 12 }}>
        {CONFLUENCE_KEYS.map(({ key, label, altKey }) => {
          const checked = hasConfluence(confluences, key, altKey);
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>{checked ? '✅' : '❌'}</span>
              <span style={{ color: checked ? '#e2e8f0' : '#94a3b8', fontSize: 13 }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Reason */}
      {signal.reason && (
        <div
          style={{
            fontStyle: 'italic',
            color: '#94a3b8',
            fontSize: 12,
            lineHeight: 1.5,
            borderTop: '1px solid #1e2433',
            paddingTop: 10,
            marginBottom: (action === 'BUY' || action === 'SELL') ? 10 : 0,
          }}
        >
          {signal.reason}
        </div>
      )}

      {/* Entry / Stop / TP1 if BUY or SELL */}
      {(action === 'BUY' || action === 'SELL') && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
          {signal.entryZone && (
            <div style={{ background: '#161b2e', border: '1px solid #1e2433', borderRadius: 6, padding: '6px 12px' }}>
              <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>ENTRY ZONE</div>
              <div style={{ fontFamily: 'monospace', color: '#e2e8f0', fontSize: 13 }}>
                ${signal.entryZone.low?.toFixed(2)} – ${signal.entryZone.high?.toFixed(2)}
              </div>
            </div>
          )}
          {signal.stopLevel != null && (
            <div style={{ background: '#161b2e', border: '1px solid #1e2433', borderRadius: 6, padding: '6px 12px' }}>
              <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>STOP LOSS</div>
              <div style={{ fontFamily: 'monospace', color: '#ff4444', fontSize: 13 }}>
                ${signal.stopLevel?.toFixed(2)}
              </div>
            </div>
          )}
          {signal.tp1 != null && (
            <div style={{ background: '#161b2e', border: '1px solid #1e2433', borderRadius: 6, padding: '6px 12px' }}>
              <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>TP1</div>
              <div style={{ fontFamily: 'monospace', color: '#00ff88', fontSize: 13 }}>
                ${signal.tp1?.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ICTSignalsPanel({ snapshot }: Props) {
  if (!snapshot || !snapshot.symbols) {
    return (
      <section>
        <h2 style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          🎯 ICT Signals
        </h2>
        <div style={{ background: '#0d1117', border: '1px solid #1e2433', borderRadius: 12, padding: 32, textAlign: 'center', color: '#94a3b8' }}>
          Loading signals...
        </div>
      </section>
    );
  }

  const entries = Object.entries(snapshot.symbols);
  if (entries.length === 0) {
    return (
      <section>
        <h2 style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🎯 ICT Signals</h2>
        <div style={{ background: '#0d1117', border: '1px solid #1e2433', borderRadius: 12, padding: 32, textAlign: 'center', color: '#94a3b8' }}>
          No symbols available.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        🎯 ICT Signals
      </h2>
      {entries.map(([key, sym]) => (
        <SymbolCard key={key} symbolKey={key} sym={sym} />
      ))}
    </section>
  );
}

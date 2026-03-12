'use client';

import { ICTSnapshot, ICTSymbol, OrderBlock, FVG } from '../types';

interface Props {
  snapshot: ICTSnapshot | null;
}

function relativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMin < 2) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD === 1) return '1 day ago';
  return `${diffD} days ago`;
}

function pricePositionLabel(pos: string): { label: string; color: string } {
  if (pos === 'discount') return { label: 'DISCOUNT', color: '#00ff88' };
  if (pos === 'premium') return { label: 'PREMIUM', color: '#ff4444' };
  return { label: 'AT EQUILIBRIUM', color: '#fbbf24' };
}

function TFBadge({ tf }: { tf: string }) {
  return (
    <span
      style={{
        background: '#1e2433',
        color: '#94a3b8',
        borderRadius: 4,
        padding: '1px 6px',
        fontSize: 10,
        fontWeight: 600,
        border: '1px solid #2a3449',
      }}
    >
      {tf}
    </span>
  );
}

function SymbolStructureCard({ symbolKey, sym }: { symbolKey: string; sym: ICTSymbol }) {
  const structure = sym.structure || ({} as any);
  const sweep = sym.liquiditySweep || ({ detected: false } as any);
  const activeOBs = (sym.orderBlocks || []).filter((ob) => ob.active);
  const activeFVGs = (sym.fvgs || []).filter((fvg) => !fvg.filled);
  const ppInfo = pricePositionLabel(structure.pricePosition || '');

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
      {/* Symbol header */}
      <div style={{ marginBottom: 14, borderBottom: '1px solid #1e2433', paddingBottom: 10 }}>
        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>{sym.name || symbolKey}</span>
        <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 8 }}>({sym.alpacaSymbol || symbolKey})</span>
      </div>

      {/* Last BOS */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Last BOS</div>
        {structure.lastBOS ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, color: structure.lastBOS.direction === 'bearish' ? '#ff4444' : '#00ff88' }}>
              {structure.lastBOS.direction === 'bearish' ? '↓' : '↑'}
            </span>
            <span style={{ fontFamily: 'monospace', color: '#e2e8f0', fontWeight: 600 }}>
              ${(structure.lastBOS.level || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{relativeDate(structure.lastBOS.date)}</span>
          </div>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: 12 }}>No BOS recorded</span>
        )}
      </div>

      {/* Swing levels */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ background: '#161b2e', border: '1px solid #1e2433', borderRadius: 6, padding: '6px 12px', flex: 1, minWidth: 100 }}>
          <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>RECENT HIGH</div>
          <div style={{ fontFamily: 'monospace', color: '#ff4444', fontWeight: 600 }}>
            ${(structure.recentHigh || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ background: '#161b2e', border: '1px solid #1e2433', borderRadius: 6, padding: '6px 12px', flex: 1, minWidth: 100 }}>
          <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>RECENT LOW</div>
          <div style={{ fontFamily: 'monospace', color: '#00ff88', fontWeight: 600 }}>
            ${(structure.recentLow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ background: '#161b2e', border: '1px solid #1e2433', borderRadius: 6, padding: '6px 12px', flex: 1, minWidth: 100 }}>
          <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>EQUILIBRIUM</div>
          <div style={{ fontFamily: 'monospace', color: '#e2e8f0', fontWeight: 600 }}>
            ${(structure.equilibrium || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Price position */}
      {structure.pricePosition && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>Price is in </span>
          <span style={{ color: ppInfo.color, fontWeight: 700, fontSize: 13 }}>{ppInfo.label}</span>
          <span style={{ color: '#94a3b8', fontSize: 12 }}> zone</span>
        </div>
      )}

      {/* Active Order Blocks */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Active Order Blocks ({activeOBs.length})
        </div>
        {activeOBs.length === 0 ? (
          <span style={{ color: '#94a3b8', fontSize: 12 }}>None</span>
        ) : (
          activeOBs.map((ob, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: ob.type === 'bullish' ? '#00ff88' : '#ff4444', fontSize: 12, fontWeight: 700, minWidth: 52 }}>
                {ob.type === 'bullish' ? '🟢 Bull' : '🔴 Bear'}
              </span>
              <span style={{ fontFamily: 'monospace', color: '#e2e8f0', fontSize: 12 }}>
                ${(ob.low || 0).toFixed(2)} – ${(ob.high || 0).toFixed(2)}
              </span>
              <TFBadge tf={ob.timeframe || '?'} />
            </div>
          ))
        )}
      </div>

      {/* Active FVGs */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Fair Value Gaps ({activeFVGs.length} unfilled)
        </div>
        {activeFVGs.length === 0 ? (
          <span style={{ color: '#94a3b8', fontSize: 12 }}>None</span>
        ) : (
          activeFVGs.map((fvg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: fvg.type === 'bullish' ? '#00ff88' : '#ff4444', fontSize: 12, fontWeight: 700, minWidth: 52 }}>
                {fvg.type === 'bullish' ? '🟢 Bull' : '🔴 Bear'}
              </span>
              <span style={{ fontFamily: 'monospace', color: '#e2e8f0', fontSize: 12 }}>
                ${(fvg.low || 0).toFixed(2)} – ${(fvg.high || 0).toFixed(2)}
              </span>
              <TFBadge tf={fvg.timeframe || '?'} />
              {fvg.filled && (
                <span style={{ color: '#888', fontSize: 10 }}>filled</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Liquidity sweep */}
      <div>
        <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          Liquidity Sweep
        </div>
        {sweep.detected ? (
          <div style={{ color: '#00ff88', fontSize: 13 }}>
            ✅ Recent sweep detected — {sweep.side?.toUpperCase() || '?'} at{' '}
            <span style={{ fontFamily: 'monospace' }}>${sweep.level?.toFixed(2)}</span>
            {sweep.date && (
              <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 6 }}>{relativeDate(sweep.date)}</span>
            )}
          </div>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: 12 }}>⚠️ No recent sweep detected</div>
        )}
      </div>
    </div>
  );
}

export default function MarketStructurePanel({ snapshot }: Props) {
  if (!snapshot || !snapshot.symbols) {
    return (
      <section>
        <h2 style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          📐 Market Structure
        </h2>
        <div style={{ background: '#0d1117', border: '1px solid #1e2433', borderRadius: 12, padding: 32, textAlign: 'center', color: '#94a3b8' }}>
          Loading market structure...
        </div>
      </section>
    );
  }

  const entries = Object.entries(snapshot.symbols);

  return (
    <section>
      <h2 style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        📐 Market Structure
      </h2>
      {entries.length === 0 ? (
        <div style={{ background: '#0d1117', border: '1px solid #1e2433', borderRadius: 12, padding: 32, textAlign: 'center', color: '#94a3b8' }}>
          No symbol data available.
        </div>
      ) : (
        entries.map(([key, sym]) => (
          <SymbolStructureCard key={key} symbolKey={key} sym={sym} />
        ))
      )}
    </section>
  );
}

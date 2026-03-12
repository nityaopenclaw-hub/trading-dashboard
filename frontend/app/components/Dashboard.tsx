'use client';

import { useEffect, useState, useCallback } from 'react';
import { ICTSnapshot } from '../types';
import TradingViewChart from './TradingViewChart';
import ICTSignalsPanel from './ICTSignalsPanel';
import MarketStructurePanel from './MarketStructurePanel';
import PositionsPanel from './PositionsPanel';
import TradeLog from './TradeLog';
import ICTMethodologyPanel from './ICTMethodologyPanel';
import AccountPanel from './AccountPanel';

const TABS = [
  { id: 'charts', label: '📊 Charts' },
  { id: 'signals', label: '🔔 ICT Signals' },
  { id: 'structure', label: '📐 Market Structure' },
  { id: 'positions', label: '📋 Positions & Logs' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState<ICTSnapshot | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('charts');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/trading?path=/api/snapshot', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data && !data.error) {
        setSnapshot(data as ICTSnapshot);
        setOnline(true);
      } else {
        setOnline(false);
      }
    } catch {
      setOnline(false);
    }
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 30_000);
    return () => clearInterval(interval);
  }, [fetchSnapshot]);

  const handleClosePosition = async (id: string) => {
    await fetch('/api/trading?path=/api/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close', positionId: id }),
    });
    await fetchSnapshot();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSnapshot();
    setRefreshing(false);
  };

  const noTradeToday = snapshot?.noTradeToday ?? false;

  return (
    <div className="min-h-screen" style={{ background: '#0a0e1a' }}>
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">📈 ICT Trading Dashboard</h1>
          <span
            className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{ background: '#f9731620', color: '#f97316', border: '1px solid #f9731640' }}
          >
            Smart Money Concepts
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{
                background: online === true ? '#00ff88' : online === false ? '#ff4444' : '#888',
                boxShadow: online === true ? '0 0 6px #00ff88' : 'none',
              }}
            />
            <span style={{ color: online === true ? '#00ff88' : online === false ? '#ff4444' : '#888' }}>
              {online === true ? 'Live' : online === false ? 'Offline' : 'Connecting...'}
            </span>
          </div>
          {lastUpdated && (
            <span className="text-xs" style={{ color: '#94a3b8' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: refreshing ? '#4a5568' : '#94a3b8',
              background: '#0f1629',
              border: '1px solid #1e2433',
              borderRadius: 6,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {refreshing ? '⟳ Refreshing…' : '⟳ Refresh'}
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #1e2433',
          marginBottom: 24,
          gap: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#e2e8f0' : '#4a5568',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #00ff88' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-10 w-full px-4 md:px-8">
        {/* No Trade Today Banner — always visible */}
        {noTradeToday && (
          <div
            style={{
              background: '#1a0808',
              border: '1px solid #ff4444',
              borderRadius: 10,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 22 }}>🚫</span>
            <div>
              <div style={{ color: '#ff4444', fontWeight: 700, fontSize: 15 }}>No Trade Today</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>
                High-impact news event or session conditions are not favorable. Stand aside.
                {snapshot?.newsEvents && snapshot.newsEvents.length > 0 && (
                  <span style={{ marginLeft: 6 }}>Events: {snapshot.newsEvents.join(', ')}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1 — Charts */}
        {activeTab === 'charts' && (
          <>
            <AccountPanel account={snapshot?.account ?? null} />
            <style>{`
              .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
              @media (max-width: 767px) {
                .charts-grid { grid-template-columns: 1fr; }
                .charts-section { margin: 0 -1rem !important; }
              }
            `}</style>
            <section className="charts-section" style={{ margin: '0 -2rem' }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#e2e8f0', paddingLeft: '2rem' }}>
                📉 Live Charts
              </h2>
              <div className="charts-grid">
                <TradingViewChart symbol="PEPPERSTONE:US500" name="US500 — S&P 500" />
                <TradingViewChart symbol="PEPPERSTONE:NAS100" name="NAS100 — NASDAQ 100" />
              </div>
            </section>
          </>
        )}

        {/* Tab 2 — ICT Signals */}
        {activeTab === 'signals' && (
          <ICTSignalsPanel snapshot={snapshot} />
        )}

        {/* Tab 3 — Market Structure */}
        {activeTab === 'structure' && (
          <MarketStructurePanel snapshot={snapshot} />
        )}

        {/* Tab 4 — Positions & Logs */}
        {activeTab === 'positions' && (
          <>
            <PositionsPanel
              positions={snapshot?.positions ?? []}
              onClose={handleClosePosition}
            />
            <TradeLog trades={snapshot?.trades ?? []} />
            <ICTMethodologyPanel />
          </>
        )}
      </div>
    </div>
  );
}

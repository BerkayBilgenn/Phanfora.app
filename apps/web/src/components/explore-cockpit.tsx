'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { MarketCandidate, PricePoint } from '@phanfora/domain';
import { freshnessBadge } from '../lib/freshness-label';
import { marketTabs, matchesMarketTab, type MarketTab } from '../lib/market-tabs';
import { exploreQuoteStats } from '../lib/explore-quote-stats';
import { ExploreTape } from './explore-tape';
import { Icon } from './cockpit-icons';
import { PriceChart } from './price-chart';

function money(value: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: value < 2 ? 4 : 2 }).format(value);
  } catch {
    return `${value.toLocaleString('tr-TR', { maximumFractionDigits: value < 2 ? 4 : 2 })} ${currency}`;
  }
}

function percent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}%`;
}

function RowSpark({ series }: { series: readonly PricePoint[] }) {
  const values = series.slice(-16).map((point) => Number(point.close));
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const path = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 56;
    const y = 20 - ((value - min) / range) * 16;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  return <svg className="explore-spark" viewBox="0 0 56 22" aria-hidden="true"><path d={path} /></svg>;
}

const copy: Record<MarketTab, { kicker: string; title: string }> = {
  all: { kicker: 'Kontrol merkezi', title: 'Seçilen varlığın serisi sağda.' },
  crypto: { kicker: '7/24 ağ', title: 'Borsa pariteleri, sürekli piyasalar.' },
  us: { kicker: 'NASDAQ / NYSE', title: 'Gecikmeli ABD kotasyonu.' },
  tr: { kicker: 'Borsa İstanbul', title: 'Gecikmeli BIST kotasyonu.' },
  forex: { kicker: 'Kurlar', title: 'Canlı parite ve günlük resmi kur.' },
  commodity: { kicker: 'Maden', title: 'Token ve spot emtia ayrımı korunur.' },
};

export function ExploreCockpit({
  items,
  loading,
  error,
  onRefresh,
  watchlist,
  onWatch,
}: {
  items: readonly MarketCandidate[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  watchlist: readonly string[];
  onWatch: (id: string) => void;
}) {
  const [tab, setTab] = useState<MarketTab>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [flash, setFlash] = useState('');
  const prevAsset = useRef('');
  const prevPrice = useRef(0);
  const filtered = useMemo(() => {
    const query = search.toLocaleLowerCase('tr-TR');
    return items.filter((item) => {
      const haystack = `${item.asset.symbol} ${item.asset.name} ${item.asset.assetClass}`.toLocaleLowerCase('tr-TR');
      return matchesMarketTab(item, tab) && haystack.includes(query);
    });
  }, [items, search, tab]);
  useEffect(() => {
    if (!filtered.some((item) => item.asset.id === selectedId)) {
      setSelectedId(filtered[0]?.asset.id ?? '');
    }
  }, [filtered, selectedId]);
  const selected = filtered.find((item) => item.asset.id === selectedId) ?? filtered[0];
  const badge = selected ? freshnessBadge(selected.quality.freshness, selected.dataMode) : null;
  useEffect(() => {
    if (!selected) return;
    const next = Number(selected.price.amount);
    if (prevAsset.current !== selected.asset.id) {
      prevAsset.current = selected.asset.id;
      prevPrice.current = next;
      setFlash('');
      return;
    }
    if (prevPrice.current && next !== prevPrice.current) {
      setFlash(next > prevPrice.current ? 'is-tick-up' : 'is-tick-down');
      prevPrice.current = next;
      const timer = window.setTimeout(() => setFlash(''), 160);
      return () => window.clearTimeout(timer);
    }
    prevPrice.current = next;
  }, [selected]);

  return (
    <section className="explore-cockpit" data-tab={tab}>
      <div className="explore-hud" aria-hidden="true">
        <span>Phanfora · feed</span>
        <span>{copy[tab].kicker}</span>
        <span>{filtered.length} kanal</span>
      </div>
      <div className="explore-toolbar">
        <div className="market-tabs" role="tablist" aria-label="Piyasa grupları">
          {marketTabs.map((item) => (
            <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'is-active' : undefined} key={item.id} onClick={() => setTab(item.id)}>{item.label}</button>
          ))}
        </div>
        <input aria-label="Varlık ara" placeholder="Sembol veya varlık ara…" value={search} onChange={(event) => setSearch(event.target.value)} />
        <button type="button" className="workspace-refresh" onClick={onRefresh}><Icon name="pulse" size={16} /> Yenile</button>
      </div>
      <div className="explore-stage">
        <ExploreTape key={tab} tab={tab} items={items.filter((item) => matchesMarketTab(item, tab))} />
        <div key={`split-${tab}`} className="explore-split" data-enter={tab}>
        <div className="explore-list workspace-panel">
          <div className="workspace-panel-heading">
            <h2>{copy[tab].kicker}</h2>
            <span>{filtered.length} sonuç</span>
          </div>
          {loading && <p className="workspace-empty">Piyasa verisi yükleniyor…</p>}
          {error && <p className="workspace-empty" role="alert">{error}</p>}
          {!loading && !error && !filtered.length && <p className="workspace-empty">Bu grupta şu anda çekilebilen varlık yok.</p>}
          {filtered.map((item, index) => {
            const rowBadge = freshnessBadge(item.quality.freshness, item.dataMode);
            return (
              <button type="button" className={`explore-row ${selected?.asset.id === item.asset.id ? 'is-selected' : ''}`} style={{ '--row': Math.min(index, 8) } as CSSProperties} key={item.asset.id} onClick={() => setSelectedId(item.asset.id)}>
                <span className="workspace-symbol">{item.asset.symbol.slice(0, 3)}</span>
                <span className="workspace-quote"><strong>{item.asset.symbol}</strong><small>{item.asset.name}</small></span>
                <RowSpark series={item.series} />
                <span className="workspace-number"><strong>{money(Number(item.price.amount), item.price.currency)}</strong><small className={Number(item.changePercent) >= 0 ? 'positive' : 'negative'}>{percent(Number(item.changePercent))}</small></span>
                <span className={`freshness-badge is-${rowBadge.tone}${rowBadge.tone === 'live' ? ' is-pip' : ''}`} aria-label={`Veri durumu: ${rowBadge.text}`}>{rowBadge.tone === 'live' ? '' : rowBadge.text}</span>
              </button>
            );
          })}
        </div>
        <aside className="explore-chart workspace-panel">
          <p className="explore-kicker">{copy[tab].title}</p>
          {selected ? (
            <>
              <div className="explore-chart-head">
                <div>
                  <h2>{selected.asset.symbol}</h2>
                  <p>{selected.asset.name} · {selected.source}</p>
                </div>
                {badge && <span className={`freshness-badge is-${badge.tone}`}>{badge.text}</span>}
              </div>
              <p className={`explore-price ${flash}`}>{money(Number(selected.price.amount), selected.price.currency)} <small className={Number(selected.changePercent) >= 0 ? 'positive' : 'negative'}>{percent(Number(selected.changePercent))}</small></p>
              <PriceChart key={selected.asset.id} name={selected.asset.symbol} series={selected.series} />
              <dl className="explore-stats">
                {exploreQuoteStats(selected).map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
              <button type="button" className="workspace-action" onClick={() => onWatch(selected.asset.id)}>{watchlist.includes(selected.asset.id) ? 'Takipte' : '+ Takip et'}</button>
            </>
          ) : <p className="workspace-empty">Grafik için bir varlık seç.</p>}
        </aside>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { AnalysisInput, AnalysisResult, CurrencyDefinition, Horizon, MarketCandidate } from '@phanfora/domain';
import { createAnalysis, fetchCurrencies } from '../lib/api';
import { useMarket } from '../lib/use-market';
import { loadWorkspace, parseWorkspace, saveAnalysis, saveWorkspace, subscribeWorkspace, workspaceSnapshot } from '../lib/workspace';
import { AnalysisPanel } from './analysis-wizard';
import { CockpitChart } from './cockpit-chart';
import { formatDecimal } from './cockpit-data';
import { Icon } from './cockpit-icons';

const rangeTabs = [
  { label: '1G', horizon: 'daily' },
  { label: '1H', horizon: 'weekly' },
  { label: '1A', horizon: 'monthly' },
] as const;
const fallbackCurrencies: CurrencyDefinition[] = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺', minorUnits: 2 },
  { code: 'USD', name: 'ABD Doları', symbol: '$', minorUnits: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', minorUnits: 2 },
];
function ScoreBar({ value }: { value: number }) { return <div className="mini-score-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label="Gösterge puanı"><span style={{ width: `${value}%` }} /></div>; }
function MetricCard({ title, icon, value, detail, note, children }: { title: string; icon: 'trend' | 'drop' | 'pulse' | 'shield'; value: string; detail: string; note: string; children: React.ReactNode }) {
  return <article className="metric-card"><div className="metric-heading"><Icon name={icon} size={24} /><h3>{title}</h3><span className="metric-info" title={title}><Icon name="info" size={15} /></span></div><div className="metric-body"><div><strong>{value}</strong><small>{detail}</small></div>{children}</div><p>{note}</p></article>;
}
function RadarGraphic({ items }: { items: MarketCandidate[] }) {
  return <svg className="radar-graphic" viewBox="0 0 220 220" role="img" aria-label="Tarama kapsamındaki varlıklar">
    <defs><linearGradient id="radar-beam" x1="0" y1="1" x2=".7" y2="0"><stop stopColor="#20e5b4" stopOpacity="0" /><stop offset="1" stopColor="#20e5b4" stopOpacity=".65" /></linearGradient></defs>
    {[101, 79, 57, 30].map((radius) => <circle key={radius} cx="110" cy="110" r={radius} className="radar-ring" />)}<path d="M110 9V211M9 110H211" className="radar-cross" /><path d="M110 110 110 10 A100 100 0 0 1 162 24Z" fill="url(#radar-beam)" className="radar-beam" /><circle cx="110" cy="110" r="5" fill="#35f0c1" className="radar-center" />
    {items.map((item, index) => { const angle = index * 2.39996; const radius = 25 + item.dimensions.trend * .68; return <circle key={item.asset.id} cx={110 + Math.cos(angle) * radius} cy={110 + Math.sin(angle) * radius} r="3.5" fill="#28e7ba" />; })}
  </svg>;
}
function MiniSeries({ item }: { item: MarketCandidate }) {
  const values = item.series.slice(-30).map((point) => Number(point.close));
  if (values.length < 2) return null;
  const min = Math.min(...values); const span = Math.max(0.0001, Math.max(...values) - min);
  return <svg className="sparkline" viewBox="0 0 160 42" preserveAspectRatio="none" aria-hidden="true"><polyline points={values.map((value, index) => `${(index / (values.length - 1)) * 160},${39 - ((value - min) / span) * 35}`).join(' ')} fill="none" stroke="#20dfb5" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>;
}
export function MarketCockpit() {
  const workspaceRaw = useSyncExternalStore(subscribeWorkspace, workspaceSnapshot, () => '');
  const settings = useMemo(() => parseWorkspace(workspaceRaw).settings, [workspaceRaw]);
  const [horizon, setHorizon] = useState<Horizon>('daily');
  const market = useMarket(horizon, settings.refreshSeconds * 1000);
  const [selectedId, setSelectedId] = useState('');
  const [showSma, setShowSma] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [clearKey, setClearKey] = useState(0);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const [busy, setBusy] = useState(false);
  const [currencies, setCurrencies] = useState<CurrencyDefinition[]>(fallbackCurrencies);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { void fetchCurrencies().then(setCurrencies).catch(() => {}); }, []);
  useEffect(() => { const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut); }, []);
  const items = market.items;
  const selected = items.find((item) => item.asset.id === selectedId) ?? items[0];
  const matches = useMemo(() => items.filter((item) => `${item.asset.symbol} ${item.asset.name}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))), [items, search]);
  const sorted = [...items].sort((a, b) => b.dimensions.trend - a.dimensions.trend);
  const rising = items.filter((item) => Number(item.changePercent) > 0).length;
  const falling = items.filter((item) => Number(item.changePercent) < 0).length;
  const unchanged = items.length - rising - falling;
  const high = selected ? Math.max(...selected.series.map((point) => Number(point.high ?? point.close))) : null;
  const low = selected ? Math.min(...selected.series.map((point) => Number(point.low ?? point.close))) : null;
  async function runAnalysis(input: AnalysisInput) {
    setBusy(true); setAnalysisError('');
    try { const result = await createAnalysis(input); setAnalysis(result); saveWorkspace(saveAnalysis(loadWorkspace(), result)); setSelectedId(result.primary.asset.id); dialogRef.current?.close(); }
    catch (caught) { setAnalysisError(caught instanceof Error ? caught.message : 'Analiz tamamlanamadı.'); }
    finally { setBusy(false); }
  }
  const selectedScore = analysis && selected ? [analysis.primary, ...analysis.alternatives].find((item) => item.asset.id === selected.asset.id) : null;
  const formattedTime = selected ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(new Date(selected.observedAt)) : '';
  return <div className="cockpit-page">
    <div className="cockpit-intro"><div><h1>Piyasa Kontrol Merkezi</h1><p>Kaynağı belli piyasa verileri ve analizler. Daha bilinçli kararlar.</p></div><div className="cockpit-actions"><div className="asset-search"><Icon name="search" size={21} /><input ref={searchRef} aria-label="Hisse, endeks veya sembol ara" placeholder="Varlık veya sembol ara..." value={search} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); if (event.key === 'Enter' && matches[0]) { setSelectedId(matches[0].asset.id); setSearchOpen(false); } }} /><kbd>⌘ K</kbd>{searchOpen && search && <div className="search-popover" role="listbox">{matches.length ? matches.map((item) => <button key={item.asset.id} type="button" role="option" aria-selected={selected?.asset.id === item.asset.id} onClick={() => { setSelectedId(item.asset.id); setSearch(item.asset.symbol); setSearchOpen(false); }}><strong>{item.asset.symbol}</strong><span>{item.asset.name}</span></button>) : <p>Sonuç bulunamadı.</p>}</div>}</div><button type="button" className="new-analysis" onClick={() => dialogRef.current?.showModal()}><Icon name="plus" size={24} /> Yeni Analiz</button></div></div>
    {market.error && <div className="cockpit-data-alert" role="alert"><strong>Piyasa verisi alınamadı.</strong> {market.error} <button type="button" onClick={() => void market.refresh()}>Yeniden dene</button></div>}
    <div className="cockpit-main-grid"><div className="cockpit-left"><section className="hero-card" aria-labelledby="selected-asset-name"><div className="asset-overview"><div className="hero-asset"><span className="nvidia-badge">{selected?.asset.symbol.slice(0, 2) ?? '—'}</span><div><h2 id="selected-asset-name">{selected ? `${selected.asset.exchangeOrVenue} · ${selected.asset.symbol}` : market.loading ? 'Piyasa verisi yükleniyor' : 'Varlık seçilemedi'}</h2><p>{selected?.asset.name ?? 'Veri bağlantısını kontrol et.'}</p><div className="hero-tags"><span>{selected?.asset.assetClass === 'crypto' ? 'Kripto' : selected?.asset.assetClass ?? '—'}</span><span>{selected?.asset.exchangeOrVenue ?? '—'}</span><span>{selected?.asset.quoteCurrency ?? '—'}</span></div></div></div><div className="hero-score"><span>{selectedScore ? 'Phanfora Skoru' : 'Trend göstergesi'} <Icon name="info" size={15} /></span><div><strong>{selectedScore?.totalScore ?? selected?.dimensions.trend ?? '—'}</strong><small>/100</small></div><p><i />{selectedScore ? 'Analiz sonucu' : selected ? 'Fiyat serisinden hesaplandı' : 'Veri bekleniyor'}</p></div><div className="hero-price"><strong>{selected ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: selected.price.currency, maximumFractionDigits: Number(selected.price.amount) < 2 ? 4 : 2 }).format(Number(selected.price.amount)) : '—'}</strong><span className={Number(selected?.changePercent ?? 0) >= 0 ? 'positive' : 'negative'}>{selected ? `${Number(selected.changePercent) >= 0 ? '+' : ''}${formatDecimal(Number(selected.changePercent))}%` : '—'}</span></div><div className="hero-facts"><div><small>Gösterilen aralık</small><span>{selected && low !== null && high !== null ? `${formatDecimal(low)} – ${formatDecimal(high)}` : '—'}</span></div><div><small>Son gözlem</small><span>{formattedTime || '—'}</span></div><div><small>Veri kaynağı</small><span>{selected?.source ?? '—'}</span></div></div></div><div className="chart-toolbar"><div className="range-tabs" aria-label="Grafik zaman aralığı">{rangeTabs.map((tab) => <button key={tab.label} type="button" className={horizon === tab.horizon ? 'active' : ''} aria-pressed={horizon === tab.horizon} onClick={() => setHorizon(tab.horizon)}>{tab.label}</button>)}</div><div className="chart-tools"><button type="button" aria-pressed={showSma} className={showSma ? 'selected' : ''} onClick={() => setShowSma(!showSma)}><Icon name="trend" size={18} /> Göstergeler</button><button type="button" aria-pressed={drawing} className={drawing ? 'selected' : ''} onClick={() => setDrawing(!drawing)}><Icon name="pen" size={18} /> Çizim</button>{drawing && <button type="button" onClick={() => setClearKey(clearKey + 1)}>Çizgileri sil</button>}<button type="button" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void chartRef.current?.requestFullscreen?.(); }}><Icon name="expand" size={17} /> Tam Ekran</button></div></div><div ref={chartRef} className={`chart-frame ${drawing ? 'drawing' : ''}`}><CockpitChart symbol={selected?.asset.symbol ?? '—'} series={selected?.series ?? []} showSma={showSma} drawing={drawing} clearKey={clearKey} /></div></section>
    <div className="metrics-grid"><MetricCard title="Momentum" icon="trend" value={selected ? `${selected.dimensions.momentum}` : '—'} detail="gösterge puanı" note="Son fiyat hareketinden hesaplanır."><ScoreBar value={selected?.dimensions.momentum ?? 0} /></MetricCard><MetricCard title="Likidite" icon="drop" value={selected ? `${selected.dimensions.liquidity}` : '—'} detail="gösterge puanı" note="Kaynak seri ve varlık sınıfı değerlendirmesi."><ScoreBar value={selected?.dimensions.liquidity ?? 0} /></MetricCard><MetricCard title="Volatilite" icon="pulse" value={selected ? `%${formatDecimal(selected.volatility, 1)}` : '—'} detail="gözlenen oynaklık" note="Gösterilen fiyat serisinden hesaplanır."><ScoreBar value={selected ? Math.min(100, selected.volatility) : 0} /></MetricCard><MetricCard title="Risk Uyumu" icon="shield" value={selected ? `${selected.dimensions.riskFit}` : '—'} detail="gösterge puanı" note="Fiyat oynaklığına dayalı göstergedir."><div className="mini-ring" style={{ '--ring-value': `${selected?.dimensions.riskFit ?? 0}%` } as React.CSSProperties}><span>{selected?.dimensions.riskFit ?? '—'}</span></div></MetricCard></div></div>
    <aside className="cockpit-right"><section className="side-card radar-card"><div className="side-card-heading"><h2>Radar Taraması</h2><Link href="/radar">Tümünü Gör <Icon name="arrow" size={17} /></Link></div><div className="radar-body"><RadarGraphic items={items} /><div className="radar-stats"><p><strong>{items.length}</strong> varlık tarandı</p><div><span className="positive">▲</span> <b>{rising}</b> yükselen</div><div><span className="negative">▼</span> <b>{falling}</b> düşen</div><div><span className="muted-dot">●</span> {unchanged} değişmeyen</div></div></div><div className="radar-footer"><i /> {market.loading ? 'Tarama sürüyor' : market.error ? 'Veri alınamadı' : 'Tarama tamamlandı'} <span>·</span> {items[0]?.source ?? 'Kaynak yok'}</div></section>
    <section className="side-card opportunities-card"><div className="side-card-heading"><h2>Varlık İzleme</h2><Link href="/explore">Tümünü Gör <Icon name="arrow" size={17} /></Link></div><div className="opportunity-rows">{sorted.slice(0, 5).map((item, index) => <button type="button" key={item.asset.id} className={`opportunity-row ${selected?.asset.id === item.asset.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(item.asset.id)} aria-label={`${item.asset.name} varlığını görüntüle`}><span className="opportunity-rank">{index + 1}</span><span className="opportunity-symbol"><strong>{item.asset.symbol}</strong>{index === 0 && <small>{item.asset.name}</small>}</span><span className="opportunity-score">{item.dimensions.trend}</span><span className={Number(item.changePercent) >= 0 ? 'positive' : 'negative'}>{Number(item.changePercent) >= 0 ? '+' : ''}{formatDecimal(Number(item.changePercent))}%</span><MiniSeries item={item} /></button>)}{!items.length && <p className="workspace-empty">Varlık verisi bekleniyor.</p>}</div></section>
    <section className="side-card breadth-card"><div className="side-card-heading"><h2>Tarama Özeti</h2><Link href="/radar">Detaylar <Icon name="arrow" size={17} /></Link></div><div className="breadth-content"><div className="breadth-ring" style={{ background: `conic-gradient(#22e2af ${items.length ? rising / items.length * 100 : 0}%, #294e5d 0)` }}><div><strong>{items.length ? `%${Math.round(rising / items.length * 100)}` : '—'}</strong><span>Yükselen</span></div></div><div className="breadth-values"><div><span>Yükselen</span><strong className="positive">{rising}</strong></div><div><span>Düşen</span><strong className="negative">{falling}</strong></div><div><span>Değişmeyen</span><strong>{unchanged}</strong></div></div></div><div className="breadth-bar"><span style={{ width: `${items.length ? rising / items.length * 100 : 0}%` }} /><span style={{ width: `${items.length ? falling / items.length * 100 : 0}%` }} /><span style={{ width: `${items.length ? unchanged / items.length * 100 : 0}%` }} /></div></section></aside></div>
    <footer className="cockpit-footer"><div><strong>PHANFORA</strong><span>│</span> Finansal veriler bilgilendirme amaçlıdır. Yatırım tavsiyesi değildir.</div><div className="footer-status"><i /> {selected ? `Gözlem: ${formattedTime}` : 'Fiyat verisi yok'} <span>│</span> {selected?.source ?? 'Kaynak yok'} <span>│</span> Phanfora v1</div></footer>
    <dialog ref={dialogRef} className="analysis-dialog" onClose={() => setAnalysisError('')}><div className="dialog-top"><span>Yeni Analiz</span><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Analiz penceresini kapat"><Icon name="close" /></button></div><AnalysisPanel key={`${settings.horizon}-${settings.riskProfile}`} currencies={currencies} onSubmit={runAnalysis} busy={busy} marketCount={items.length} classCount={new Set(items.map((item) => item.asset.assetClass)).size} initialHorizon={settings.horizon} initialRiskProfile={settings.riskProfile} />{analysisError && <p className="dialog-error" role="alert">{analysisError}</p>}</dialog>
  </div>;
}

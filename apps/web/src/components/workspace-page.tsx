'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { AnalysisInput, AnalysisResult, CurrencyDefinition, MarketCandidate } from '@phanfora/domain';
import { AnalysisPanel } from './analysis-wizard';
import { Icon } from './cockpit-icons';
import { createAnalysis, fetchCurrencies } from '../lib/api';
import { useMarket } from '../lib/use-market';
import { addHolding, addWatch, evaluateAlerts, parseWorkspace, saveAnalysis, saveWorkspace, subscribeWorkspace, workspaceSnapshot, type Workspace } from '../lib/workspace';

type Section = 'markets' | 'radar' | 'analyses' | 'portfolio' | 'watchlist' | 'alerts' | 'reports' | 'settings';
const metadata: Record<Section, { eyebrow: string; title: string; subtitle: string }> = {
  markets: { eyebrow: 'Piyasa verisi', title: 'Piyasalar', subtitle: 'Kaynağı ve gözlem zamanı doğrulanmış varlık fiyatları.' },
  radar: { eyebrow: 'Piyasa taraması', title: 'Radar', subtitle: 'Bağlı veri kaynağındaki varlıkların fiyat ve gösterge özeti.' },
  analyses: { eyebrow: 'Karar arşivi', title: 'Analizler', subtitle: 'Oluşturduğun analizler, hesaplandıkları andaki verilerle saklanır.' },
  portfolio: { eyebrow: 'Kişisel kayıtlar', title: 'Portföy', subtitle: 'Kendi pozisyonlarını ekle; güncel fiyat varsa gerçekleşmemiş farkı izle.' },
  watchlist: { eyebrow: 'Kişisel kayıtlar', title: 'Takip Listesi', subtitle: 'İzlemek istediğin varlıkları ekle ve fiyatlarını takip et.' },
  alerts: { eyebrow: 'Fiyat koşulları', title: 'Alarmlar', subtitle: 'Bu sayfa açıkken güncellenen fiyatlarla eşiklerini kontrol et.' },
  reports: { eyebrow: 'Veri çıktısı', title: 'Raporlar', subtitle: 'Kişisel kayıtlarını ve mevcut piyasa anlık görüntüsünü dışa aktar.' },
  settings: { eyebrow: 'Tercihler', title: 'Ayarlar', subtitle: 'Analiz varsayılanlarını ve yenileme sıklığını belirle.' },
};
function money(value: number, currency = 'USD') { return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: value < 2 ? 4 : 2 }).format(value); }
function percent(value: number) { return `${value >= 0 ? '+' : ''}${value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}%`; }
function date(value: string) { return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(new Date(value)); }
function download(name: string, content: string, mime: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type: mime }));
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
function quoteRow(item: MarketCandidate, extra?: React.ReactNode) {
  return <div className="workspace-row" key={item.asset.id}>
    <span className="workspace-symbol">{item.asset.symbol.slice(0, 3)}</span>
    <div><strong>{item.asset.symbol}</strong><small>{item.asset.name} · {item.asset.exchangeOrVenue}</small></div>
    <div className="workspace-number"><strong>{money(Number(item.price.amount), item.price.currency)}</strong><small className={Number(item.changePercent) >= 0 ? 'positive' : 'negative'}>{percent(Number(item.changePercent))}</small></div>
    {extra}
  </div>;
}
function Status({ error, loading, items, refresh }: { error: string; loading: boolean; items: MarketCandidate[]; refresh: () => Promise<void> }) {
  if (loading) return <div className="workspace-status" role="status">Piyasa verisi yükleniyor…</div>;
  if (error) return <div className="workspace-status is-error" role="alert"><strong>Piyasa verisi alınamadı.</strong><span>{error}</span><button type="button" onClick={() => void refresh()}>Yeniden dene</button></div>;
  if (!items.length) return <div className="workspace-status">Bu kaynakta gösterilebilecek varlık bulunamadı.</div>;
  return null;
}
function AnalysisRunner({ onResult, items, settings }: { onResult: (result: AnalysisResult) => void; items: MarketCandidate[]; settings: Workspace['settings'] }) {
  const [currencies, setCurrencies] = useState<CurrencyDefinition[]>([{ code: 'TRY', name: 'Türk Lirası', symbol: '₺', minorUnits: 2 }, { code: 'USD', name: 'ABD Doları', symbol: '$', minorUnits: 2 }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { void fetchCurrencies().then(setCurrencies).catch(() => {}); }, []);
  async function submit(input: AnalysisInput) {
    setBusy(true); setError('');
    try { onResult(await createAnalysis(input)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Analiz yapılamadı.'); }
    finally { setBusy(false); }
  }
  return <div className="workspace-analysis-form"><AnalysisPanel key={`${settings.horizon}-${settings.riskProfile}`} currencies={currencies} onSubmit={submit} busy={busy} marketCount={items.length} classCount={new Set(items.map((item) => item.asset.assetClass)).size} initialHorizon={settings.horizon} initialRiskProfile={settings.riskProfile} />{error && <p role="alert" className="workspace-error">{error}</p>}</div>;
}
export function WorkspacePage({ section }: { section: Section }) {
  const snapshot = useSyncExternalStore(subscribeWorkspace, workspaceSnapshot, () => '');
  const workspace = useMemo(() => parseWorkspace(snapshot), [snapshot]);
  const [search, setSearch] = useState('');
  const [assetId, setAssetId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [threshold, setThreshold] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [formError, setFormError] = useState('');
  const market = useMarket(section === 'radar' ? 'weekly' : workspace.settings.horizon, workspace.settings.refreshSeconds * 1000);
  const quotes = market.items;
  const byId = useMemo(() => new Map(quotes.map((item) => [item.asset.id, item])), [quotes]);
  function commit(next: Workspace) { saveWorkspace(next); }
  const currentAsset = assetId || quotes[0]?.asset.id || '';
  const alertHits = evaluateAlerts(workspace, quotes.map((item) => ({ assetId: item.asset.id, price: Number(item.price.amount) })));
  const filtered = quotes.filter((item) => `${item.asset.symbol} ${item.asset.name} ${item.asset.assetClass}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')));
  const info = metadata[section];
  return <div className="workspace-page">
    <header className="workspace-header"><div><p className="eyebrow">{info.eyebrow}</p><h1>{info.title}</h1><p>{info.subtitle}</p></div><button type="button" className="workspace-refresh" onClick={() => void market.refresh()}><Icon name="pulse" size={16} /> Yenile</button></header>
    <div className="workspace-source"><span className={market.error ? 'source-dot is-offline' : 'source-dot'} />{market.error ? 'Bağlantı yok' : market.loading ? 'Bağlanıyor' : quotes[0]?.source ?? 'Kaynak yok'}<span>·</span>{quotes.length ? `${quotes.length} varlık` : 'Fiyat yok'}{market.updatedAt && <><span>·</span> Son sorgu {date(market.updatedAt)}</>}</div>
    {section !== 'settings' && <Status {...market} />}
    {section === 'markets' && <><div className="workspace-toolbar"><input aria-label="Varlık ara" placeholder="Sembol veya varlık ara…" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="workspace-panel"><div className="workspace-panel-heading"><h2>Varlıklar</h2><span>{filtered.length} sonuç</span></div>{filtered.map((item) => quoteRow(item, <button type="button" className="workspace-action" key="watch" onClick={() => commit(addWatch(workspace, item.asset.id))}>{workspace.watchlist.includes(item.asset.id) ? 'Takipte' : '+ Takip et'}</button>))}</div></>}
    {section === 'radar' && <><div className="workspace-kpis"><div><span>Tarama kapsamı</span><strong>{quotes.length}</strong><small>yalnızca veri sağlayıcısındaki varlıklar</small></div><div><span>Yükselen</span><strong>{quotes.filter((item) => Number(item.changePercent) > 0).length}</strong><small>haftalık fiyat değişimi</small></div><div><span>Düşen</span><strong>{quotes.filter((item) => Number(item.changePercent) < 0).length}</strong><small>haftalık fiyat değişimi</small></div></div><div className="workspace-panel"><div className="workspace-panel-heading"><h2>Fiyat değişimine göre</h2><span>Haftalık seri</span></div>{[...quotes].sort((a,b) => Number(b.changePercent) - Number(a.changePercent)).map((item) => quoteRow(item, <span key="trend" className="workspace-small">Trend {item.dimensions.trend}/100</span>))}</div><div className="workspace-panel"><div className="workspace-panel-heading"><h2>Yeni analiz</h2></div><AnalysisRunner items={quotes} settings={workspace.settings} onResult={(result) => commit(saveAnalysis(workspace, result))} /></div></>}
    {section === 'analyses' && <>
      <div className="workspace-panel">
        <div className="workspace-panel-heading"><h2>Kaydedilen analizler</h2><span>{workspace.analyses.length} kayıt</span></div>
        {!workspace.analyses.length && <p className="workspace-empty">Henüz analiz oluşturmadın.</p>}
        {workspace.analyses.map((item) => <div className="workspace-analysis-record" key={item.id}>
          <div className="workspace-row">
            <span className="workspace-symbol">{item.primary.asset.symbol.slice(0, 3)}</span>
            <div><strong>{item.primary.asset.name}</strong><small>{date(item.calculatedAt)} · {item.primary.source}</small></div>
            <div className="workspace-number"><strong>{item.primary.totalScore}/100</strong><small>{item.input.horizon} · {item.input.riskProfile}</small></div>
            <button type="button" className="workspace-action" onClick={() => commit({ ...workspace, analyses: workspace.analyses.filter((record) => record.id !== item.id) })}>Sil</button>
          </div>
          <details className="workspace-analysis-detail"><summary>Analiz sonucunu gör</summary>
            <p>Hesaplama: {date(item.calculatedAt)} · Kur: {item.fxSnapshot.provider} ({date(item.fxSnapshot.observedAt)})</p>
            {[item.primary, ...item.alternatives].map((result) => <div key={result.asset.id}><strong>{result.asset.symbol} · {result.totalScore}/100</strong><span>{money(Number(result.price.amount), result.price.currency)} · {result.source} · {date(result.observedAt)}</span></div>)}
          </details>
        </div>)}
      </div>
      <div className="workspace-panel"><div className="workspace-panel-heading"><h2>Yeni analiz</h2></div><AnalysisRunner items={quotes} settings={workspace.settings} onResult={(result) => commit(saveAnalysis(workspace, result))} /></div>
    </>}
    {section === 'watchlist' && <><div className="workspace-panel"><div className="workspace-panel-heading"><h2>İzlenen varlıklar</h2><span>{workspace.watchlist.length} kayıt</span></div>{!workspace.watchlist.length && <p className="workspace-empty">Takip listesi boş. Aşağıdan bir varlık ekle.</p>}{workspace.watchlist.map((id) => { const item = byId.get(id); return item ? quoteRow(item, <button type="button" className="workspace-action" key="remove" onClick={() => commit({ ...workspace, watchlist: workspace.watchlist.filter((value) => value !== id) })}>Kaldır</button>) : <div className="workspace-row" key={id}><div><strong>{id}</strong><small>Fiyat şu anda alınamadı.</small></div><button type="button" className="workspace-action" onClick={() => commit({ ...workspace, watchlist: workspace.watchlist.filter((value) => value !== id) })}>Kaldır</button></div>; })}</div><form className="workspace-form" onSubmit={(event) => { event.preventDefault(); if (currentAsset) commit(addWatch(workspace, currentAsset)); }}><label>Varlık<select aria-label="Takip edilecek varlık" value={currentAsset} onChange={(event) => setAssetId(event.target.value)}>{quotes.map((item) => <option key={item.asset.id} value={item.asset.id}>{item.asset.symbol} · {item.asset.name}</option>)}</select></label><button type="submit" disabled={!quotes.length}>Takibe ekle</button></form></>}
    {section === 'portfolio' && <><div className="workspace-panel"><div className="workspace-panel-heading"><h2>Pozisyonlar</h2><span>{workspace.holdings.length} kayıt</span></div>{!workspace.holdings.length && <p className="workspace-empty">Henüz pozisyon eklemedin.</p>}{workspace.holdings.map((lot) => { const item = byId.get(lot.assetId); const value = item ? Number(item.price.amount) * lot.quantity : null; const difference = value === null ? null : value - lot.costBasis * lot.quantity; return <div className="workspace-row" key={lot.id}><span className="workspace-symbol">{item?.asset.symbol.slice(0,3) ?? '—'}</span><div><strong>{item?.asset.name ?? lot.assetId}</strong><small>{lot.quantity} adet · Birim maliyet {money(lot.costBasis)}</small></div><div className="workspace-number"><strong>{value === null ? 'Fiyat yok' : money(value)}</strong><small className={difference !== null && difference >= 0 ? 'positive' : 'negative'}>{difference === null ? 'Değer hesaplanamadı' : lot.costBasis === 0 ? `${money(difference)} fark` : percent((difference / (lot.costBasis * lot.quantity)) * 100)}</small></div><button type="button" className="workspace-action" onClick={() => commit({ ...workspace, holdings: workspace.holdings.filter((entry) => entry.id !== lot.id) })}>Sil</button></div>; })}</div><form className="workspace-form" onSubmit={(event) => { event.preventDefault(); try { commit(addHolding(workspace, { id: crypto.randomUUID(), assetId: currentAsset, quantity: Number(quantity), costBasis: Number(costBasis) })); setQuantity(''); setCostBasis(''); setFormError(''); } catch (caught) { setFormError(caught instanceof Error ? caught.message : 'Geçersiz kayıt.'); } }}><label>Varlık<select value={currentAsset} onChange={(event) => setAssetId(event.target.value)}>{quotes.map((item) => <option key={item.asset.id} value={item.asset.id}>{item.asset.symbol} · {item.asset.name}</option>)}</select></label><label>Miktar<input type="number" min="0.00000001" step="any" required value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><label>Birim alış fiyatı (USD)<input type="number" min="0" step="any" required value={costBasis} onChange={(event) => setCostBasis(event.target.value)} /></label><button type="submit" disabled={!quotes.length}>Pozisyon ekle</button>{formError && <p role="alert" className="workspace-error">{formError}</p>}</form></>}
    {section === 'alerts' && <><p className="workspace-hint">Alarmlar sayfa açıkken kontrol edilir; arka planda bildirim gönderilmez.</p><div className="workspace-panel"><div className="workspace-panel-heading"><h2>Fiyat alarmları</h2><span>{workspace.alerts.length} kayıt</span></div>{!workspace.alerts.length && <p className="workspace-empty">Henüz fiyat alarmı oluşturmadın.</p>}{workspace.alerts.map((alert) => <div className="workspace-row" key={alert.id}><span className="workspace-symbol">{byId.get(alert.assetId)?.asset.symbol.slice(0,3) ?? '—'}</span><div><strong>{byId.get(alert.assetId)?.asset.symbol ?? alert.assetId} {alert.direction === 'above' ? 'üzerine çıktığında' : 'altına düştüğünde'} {money(alert.threshold)}</strong><small>{alertHits.includes(alert.id) ? 'Eşik şu anda karşılandı' : alert.enabled ? 'İzleniyor' : 'Duraklatıldı'}</small></div><button type="button" className="workspace-action" onClick={() => commit({ ...workspace, alerts: workspace.alerts.map((item) => item.id === alert.id ? { ...item, enabled: !item.enabled } : item) })}>{alert.enabled ? 'Duraklat' : 'Etkinleştir'}</button><button type="button" className="workspace-action" onClick={() => commit({ ...workspace, alerts: workspace.alerts.filter((item) => item.id !== alert.id) })}>Sil</button></div>)}</div><form className="workspace-form" onSubmit={(event) => { event.preventDefault(); const level = Number(threshold); if (!currentAsset || !Number.isFinite(level) || level <= 0) return; commit({ ...workspace, alerts: [...workspace.alerts, { id: crypto.randomUUID(), assetId: currentAsset, direction, threshold: level, enabled: true }] }); setThreshold(''); }}><label>Varlık<select value={currentAsset} onChange={(event) => setAssetId(event.target.value)}>{quotes.map((item) => <option key={item.asset.id} value={item.asset.id}>{item.asset.symbol} · {item.asset.name}</option>)}</select></label><label>Koşul<select value={direction} onChange={(event) => setDirection(event.target.value as 'above' | 'below')}><option value="above">Üzerine çıkarsa</option><option value="below">Altına düşerse</option></select></label><label>Eşik fiyatı (USD)<input type="number" min="0.00000001" step="any" required value={threshold} onChange={(event) => setThreshold(event.target.value)} /></label><button type="submit" disabled={!quotes.length}>Alarm oluştur</button></form></>}
    {section === 'reports' && <><div className="workspace-kpis"><div><span>Takip listesi</span><strong>{workspace.watchlist.length}</strong></div><div><span>Pozisyon</span><strong>{workspace.holdings.length}</strong></div><div><span>Analiz</span><strong>{workspace.analyses.length}</strong></div></div><div className="workspace-panel"><div className="workspace-panel-heading"><h2>Rapor oluştur</h2></div><p className="workspace-empty">CSV dosyası pozisyonlarını ve mevcut fiyat varsa son değerini içerir. JSON dosyası tüm kişisel kayıtlarını içerir.</p><div className="workspace-report-actions"><button type="button" onClick={() => { const lines = ['Varlık,Miktar,Birim maliyet USD,Son fiyat USD,Güncel değer USD,Gözlem zamanı,Kaynak', ...workspace.holdings.map((lot) => { const quote = byId.get(lot.assetId); return [quote?.asset.symbol ?? lot.assetId, lot.quantity, lot.costBasis, quote?.price.amount ?? '', quote ? (Number(quote.price.amount) * lot.quantity).toFixed(2) : '', quote?.observedAt ?? '', quote?.source ?? ''].map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','); })]; download('phanfora-portfoy.csv', '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8'); }}>Portföy CSV indir</button><button type="button" onClick={() => download('phanfora-kayitlar.json', JSON.stringify({ exportedAt: new Date().toISOString(), workspace, quotes: quotes.map((item) => ({ asset: item.asset, price: item.price, observedAt: item.observedAt, source: item.source })) }, null, 2), 'application/json')}>Tüm kayıtları JSON indir</button></div></div></>}
    {section === 'settings' && <div className="workspace-panel"><div className="workspace-panel-heading"><h2>Uygulama tercihleri</h2></div><div className="workspace-form"><label>Varsayılan aralık<select value={workspace.settings.horizon} onChange={(event) => commit({ ...workspace, settings: { ...workspace.settings, horizon: event.target.value as Workspace['settings']['horizon'] } })}><option value="daily">Günlük</option><option value="weekly">Haftalık</option><option value="monthly">Aylık</option></select></label><label>Risk profili<select value={workspace.settings.riskProfile} onChange={(event) => commit({ ...workspace, settings: { ...workspace.settings, riskProfile: event.target.value as Workspace['settings']['riskProfile'] } })}><option value="low">Düşük</option><option value="balanced">Dengeli</option><option value="high">Yüksek</option></select></label><label>Yenileme sıklığı<select value={workspace.settings.refreshSeconds} onChange={(event) => commit({ ...workspace, settings: { ...workspace.settings, refreshSeconds: Number(event.target.value) } })}><option value="60">60 saniye</option><option value="120">2 dakika</option><option value="300">5 dakika</option></select></label></div><p className="workspace-hint">Kişisel kayıtlar yalnızca bu tarayıcıda saklanır. Hisse, emtia ve döviz için Twelve Data anahtarını sunucuda TWELVE_DATA_API_KEY olarak ayarla; anahtar yoksa Kraken kripto verileri kullanılır.</p></div>}
  </div>;
}

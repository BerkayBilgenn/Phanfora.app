'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useMarket } from '../lib/use-market';
import { parseWorkspace, subscribeWorkspace, workspaceSnapshot } from '../lib/workspace';
import { Icon } from './cockpit-icons';

const navigation = [
  { href: '/', label: 'Ana Sayfa', icon: 'home' },
  { href: '/explore', label: 'Piyasalar', icon: 'market' },
  { href: '/radar', label: 'Radar', icon: 'radar' },
  { href: '/analyses', label: 'Analizler', icon: 'file' },
  { href: '/portfolio', label: 'Portföy', icon: 'pie' },
  { href: '/watchlist', label: 'Takip Listesi', icon: 'star' },
  { href: '/alerts', label: 'Alarmlar', icon: 'bell' },
  { href: '/reports', label: 'Raporlar', icon: 'file' },
] as const;
function useIstanbulTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Istanbul' }).format(new Date()));
    update(); const id = window.setInterval(update, 1000); return () => window.clearInterval(id);
  }, []);
  return time;
}
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const time = useIstanbulTime();
  const workspaceRaw = useSyncExternalStore(subscribeWorkspace, workspaceSnapshot, () => '');
  const refreshSeconds = useMemo(() => parseWorkspace(workspaceRaw).settings.refreshSeconds, [workspaceRaw]);
  const market = useMarket('daily', refreshSeconds * 1000);
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">İçeriğe geç</a>
    <aside className="side-rail" aria-label="Ana navigasyon">
      <Link href="/" className="brand-mark" aria-label="Phanfora ana sayfa">P</Link>
      <nav>{navigation.map((item) => <Link key={item.href} href={item.href} className={`rail-link ${pathname === item.href ? 'is-active' : ''}`} aria-current={pathname === item.href ? 'page' : undefined} title={item.label}><Icon name={item.icon} size={23} /><span>{item.label}</span></Link>)}</nav>
      <Link className={`rail-link rail-settings ${pathname === '/settings' ? 'is-active' : ''}`} href="/settings"><Icon name="settings" size={23} /><span>Ayarlar</span></Link>
      <div className="rail-note">Bilgi<br />Bugün daha iyi<br />yarın için.</div>
    </aside>
    <div className="app-body"><header className="topbar">
      <Link href="/" className="top-brand"><strong>PHANFORA</strong><small>Veri. Analiz. Daha iyi kararlar.</small></Link>
      <div className="top-market"><span className="live-dot" /><span>{market.error ? 'Veri bağlantısı yok' : market.loading ? 'Bağlanıyor' : market.items[0]?.source ?? 'Piyasa verisi yok'}</span></div>
      <div className="top-tickers" aria-label="Sağlayıcıdan alınan fiyatlar">{market.items.slice(0, 4).map((item) => <div key={item.asset.id}><small>{item.asset.symbol}</small><span>{Number(item.price.amount).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} <em className={Number(item.changePercent) < 0 ? 'negative' : ''}>{Number(item.changePercent) >= 0 ? '+' : ''}{Number(item.changePercent).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}%</em></span></div>)}</div>
      <div className="top-clock"><span>İstanbul&nbsp; {time || '--:--:--'}</span><small>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeZone: 'Europe/Istanbul' }).format(new Date())}</small></div>
      <Link className="top-icon-button" href="/alerts" aria-label="Alarmları göster"><Icon name="bell" /></Link><Link className="top-icon-button" href="/settings" aria-label="Ayarları aç"><Icon name="settings" /></Link>
    </header><main id="main-content">{children}</main></div>
    {mobileOpen && <nav className="mobile-menu" aria-label="Diğer sayfalar">{navigation.slice(4).map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}><Icon name={item.icon} size={19} />{item.label}</Link>)}<Link href="/settings" onClick={() => setMobileOpen(false)}><Icon name="settings" size={19} />Ayarlar</Link></nav>}
    <nav className="mobile-nav" aria-label="Mobil navigasyon">{navigation.slice(0, 4).map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} onClick={() => setMobileOpen(false)}><Icon name={item.icon} size={21} /><small>{item.label}</small></Link>)}<button type="button" aria-label="Diğer sayfalar" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Icon name="menu" size={21} /><small>Diğer</small></button></nav>
  </div>;
}

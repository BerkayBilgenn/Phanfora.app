import Link from 'next/link';

const navigation = [
  { href: '/', label: 'Bugün', icon: '◒' },
  { href: '/explore', label: 'Keşfet', icon: '⌁' },
  { href: '/watchlist', label: 'İzleme', icon: '◇' },
  { href: '/history', label: 'Geçmiş', icon: '↺' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">İçeriğe geç</a>
      <aside className="side-rail" aria-label="Ana navigasyon">
        <Link href="/" className="brand-mark" aria-label="Phanfora ana sayfa">P</Link>
        <nav>
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="rail-link" aria-label={item.label} title={item.label}>
              <span aria-hidden="true">{item.icon}</span>
            </Link>
          ))}
        </nav>
        <button className="profile-button" type="button" aria-label="Hesabı aç">KB</button>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <Link href="/" className="wordmark">PHANFORA</Link>
          <div className="market-context"><span className="status-dot" /> Demo piyasa modu</div>
          <button type="button" className="locale-button" aria-label="Dil: Türkçe">TR</button>
        </header>
        <main id="main-content">{children}</main>
      </div>
      <nav className="mobile-nav" aria-label="Mobil navigasyon">
        {navigation.map((item) => <Link key={item.href} href={item.href}><span aria-hidden="true">{item.icon}</span><small>{item.label}</small></Link>)}
      </nav>
    </div>
  );
}

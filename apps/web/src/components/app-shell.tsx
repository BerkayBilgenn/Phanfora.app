"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Icon } from "./cockpit-icons";
import { useMarket } from "../lib/use-market";

const navigation = [
  { href: "/", label: "Genel bakış", icon: "home" },
  { href: "/explore", label: "Piyasalar", icon: "market" },
  { href: "/radar", label: "Piyasa haritası", icon: "radar" },
  { href: "/explore", label: "Keşfet", icon: "search" },
  { href: "/#compare", label: "Karşılaştır", icon: "trend" },
  { href: "/#insights", label: "İçgörüler", icon: "file" },
  { href: "/portfolio", label: "Portföy", icon: "pie" },
  { href: "/watchlist", label: "Takip listesi", icon: "star" },
  { href: "/alerts", label: "Alarmlar", icon: "bell" },
] as const;

function today() {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date());
}
function subscribeDate(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(id);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const date = useSyncExternalStore(subscribeDate, today, () => "");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const market = useMarket("monthly", 60_000);
  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!search.trim()) return;
    if (pathname !== "/")
      router.push(`/?q=${encodeURIComponent(search.trim())}`);
    else
      window.dispatchEvent(
        new CustomEvent("phanfora:search", { detail: search.trim() }),
      );
  }
  return (
    <div className="app-shell ph-shell">
      <a className="skip-link" href="#main-content">
        İçeriğe geç
      </a>
      <aside className="side-rail ph-sidebar" aria-label="Ana navigasyon">
        <Link href="/" className="ph-logo" aria-label="Phanfora ana sayfa">
          <span className="ph-logo-symbol">P</span>
          <span>PHANFORA</span>
        </Link>
        <button
          type="button"
          className="ph-space-picker"
          onClick={() => router.push("/settings")}
        >
          <span className="ph-space-icon">⌘</span>
          <span>Kişisel alan</span>
          <Icon name="chevron" size={16} />
        </button>
        <nav className="ph-side-nav">
          {navigation.map((item, index) => (
            <Link
              key={`${item.label}-${index}`}
              href={item.href}
              className={`ph-nav-link ${pathname === item.href && (index === 0 || !navigation.slice(0, index).some((entry) => entry.href === item.href)) ? "is-current" : ""}`}
              aria-current={
                pathname === item.href &&
                (index === 0 ||
                  !navigation
                    .slice(0, index)
                    .some((entry) => entry.href === item.href))
                  ? "page"
                  : undefined
              }
            >
              <Icon name={item.icon} size={21} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="ph-sidebar-bottom">
          <div
            className={`ph-feed-state ${market.error ? "is-offline" : market.loading ? "is-loading" : ""}`}
          >
            <i />
            Veri akışı{" "}
            <span>
              {market.error
                ? "bağlantı yok"
                : market.loading
                  ? "bağlanıyor"
                  : market.items.length
                    ? market.items[0]?.source
                    : "veri yok"}
            </span>
          </div>
          <Link
            href="/settings"
            className={`ph-nav-link ${pathname === "/settings" ? "is-current" : ""}`}
          >
            <Icon name="settings" size={21} />
            <span>Ayarlar</span>
          </Link>
          <Link href="/settings" className="ph-profile">
            <span className="ph-avatar">H</span>
            <span>
              <strong>Hesabım</strong>
              <small>Kişisel alan</small>
            </span>
            <span aria-hidden="true">···</span>
          </Link>
        </div>
      </aside>
      <div className="app-body ph-app-body">
        <header className="topbar ph-topbar">
          <div className="ph-breadcrumb">
            <span>Çalışma alanı</span>
            <b>/</b>
            <strong>
              {pathname === "/"
                ? "Genel bakış"
                : (navigation.find((item) => item.href === pathname)?.label ??
                  "Ayarlar")}
            </strong>
          </div>
          <form className="ph-global-search" onSubmit={submitSearch}>
            <Icon name="search" size={19} />
            <input
              aria-label="Varlık, piyasa veya konu ara"
              placeholder="Varlık, piyasa veya konu ara..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>
          <Link className="ph-header-bell" href="/alerts" aria-label="Alarmlar">
            <Icon name="bell" size={21} />
          </Link>
          <div className="ph-header-date">
            <strong>{date || "—"}</strong>
            <small>
              {date
                ? new Intl.DateTimeFormat("tr-TR", {
                    weekday: "long",
                    timeZone: "Europe/Istanbul",
                  }).format(new Date())
                : "—"}
            </small>
          </div>
        </header>
        <main id="main-content">{children}</main>
      </div>
      {mobileOpen && (
        <nav className="mobile-menu" aria-label="Diğer sayfalar">
          {navigation.slice(4).map((item, index) => (
            <Link
              key={`${item.label}-${index}`}
              href={item.href}
              onClick={() => setMobileOpen(false)}
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </Link>
          ))}
          <Link href="/settings" onClick={() => setMobileOpen(false)}>
            <Icon name="settings" size={19} />
            Ayarlar
          </Link>
        </nav>
      )}
      <nav className="mobile-nav" aria-label="Mobil navigasyon">
        {navigation.slice(0, 4).map((item, index) => (
          <Link
            key={`${item.label}-${index}`}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <Icon name={item.icon} size={21} />
            <small>{item.label}</small>
          </Link>
        ))}
        <button
          type="button"
          aria-label="Diğer sayfalar"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Icon name="menu" size={21} />
          <small>Diğer</small>
        </button>
      </nav>
    </div>
  );
}

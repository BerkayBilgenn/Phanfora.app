import { Bookmark, Clock3, Compass, House } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { copy, type Locale } from '@/lib/copy'
import { BrandMark } from './brand-mark'
import { SkipLink } from './skip-link'

type AppShellProps = {
  children: ReactNode
  locale?: Locale
  controls?: ReactNode
}

const navItems = [
  { key: 'today', icon: House, active: true },
  { key: 'explore', icon: Compass, active: false },
  { key: 'watch', icon: Bookmark, active: false },
  { key: 'history', icon: Clock3, active: false },
] as const

export function AppShell({ children, locale = 'tr-TR', controls }: AppShellProps) {
  const text = copy[locale]

  return (
    <div className="app-shell">
      <SkipLink label={text.skip} />
      <header className="app-header">
        <BrandMark />
        {controls}
      </header>
      <nav className="app-nav" aria-label={text.navLabel}>
        <ul className="nav-list">
          {navItems.map(({ key, icon: Icon, active }) => {
            const label = text.nav[key]
            const content = (
              <>
                <Icon aria-hidden="true" size={21} strokeWidth={1.5} />
                <span>{label}</span>
              </>
            )

            return (
              <li key={key}>
                {active ? (
                  <Link className="nav-item nav-item-active" href="/" aria-current="page">
                    {content}
                  </Link>
                ) : (
                  <span className="nav-item nav-item-disabled" aria-disabled="true">
                    {content}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
      <main id="main-content" className="app-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}

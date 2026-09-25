'use client'

import { useSyncExternalStore } from 'react'
import { AnalysisExperience } from '@/features/analysis/analysis-experience'
import { copy, type Locale } from '@/lib/copy'
import { AppShell } from './app-shell'

const storageKey = 'phanfora-locale'
const localeChangeEvent = 'phanfora-locale-change'

function getLocaleSnapshot(): Locale {
  const saved = sessionStorage.getItem(storageKey)
  return saved === 'en-US' ? 'en-US' : 'tr-TR'
}

function getServerLocaleSnapshot(): Locale {
  return 'tr-TR'
}

function subscribeToLocale(onStoreChange: () => void) {
  window.addEventListener(localeChangeEvent, onStoreChange)
  return () => window.removeEventListener(localeChangeEvent, onStoreChange)
}

export function LocalizedApp() {
  const locale = useSyncExternalStore(subscribeToLocale, getLocaleSnapshot, getServerLocaleSnapshot)

  function selectLocale(nextLocale: Locale) {
    sessionStorage.setItem(storageKey, nextLocale)
    window.dispatchEvent(new Event(localeChangeEvent))
  }

  const text = copy[locale]
  const localeControl = (
    <div className="locale-control" role="group" aria-label={text.languageLabel}>
      <button type="button" aria-pressed={locale === 'tr-TR'} onClick={() => selectLocale('tr-TR')}>{text.languages.tr}</button>
      <button type="button" aria-pressed={locale === 'en-US'} onClick={() => selectLocale('en-US')}>{text.languages.en}</button>
    </div>
  )

  return (
    <AppShell locale={locale} controls={localeControl}>
      <AnalysisExperience key={locale} locale={locale} />
    </AppShell>
  )
}

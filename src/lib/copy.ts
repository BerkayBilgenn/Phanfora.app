export type Locale = 'tr-TR' | 'en-US'

type Copy = {
  skip: string
  navLabel: string
  nav: { today: string; explore: string; watch: string; history: string }
  hero: { eyebrow: string; title: string; body: string }
}

const tr: Copy = {
  skip: 'İçeriğe geç',
  navLabel: 'Ana navigasyon',
  nav: { today: 'Bugün', explore: 'Keşfet', watch: 'İzleme', history: 'Geçmiş' },
  hero: {
    eyebrow: 'Küresel piyasa analizi',
    title: 'Piyasaları kendi koşullarına göre tara',
    body: 'Tutarını, vadeni ve risk tercihini belirle. Phanfora öne çıkan fırsatları nedenleriyle sıralasın.',
  },
}

const en: Copy = {
  skip: 'Skip to content',
  navLabel: 'Primary navigation',
  nav: { today: 'Today', explore: 'Explore', watch: 'Watchlist', history: 'History' },
  hero: {
    eyebrow: 'Global market analysis',
    title: 'Scan markets on your terms',
    body: 'Set your amount, horizon, and risk preference. Phanfora ranks notable opportunities and explains why.',
  },
}

export const copy = { 'tr-TR': tr, 'en-US': en } as const

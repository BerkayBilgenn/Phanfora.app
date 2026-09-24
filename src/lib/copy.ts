export type Locale = 'tr-TR' | 'en-US'

type Copy = {
  skip: string
  navLabel: string
  nav: { today: string; explore: string; watch: string; history: string }
  hero: { eyebrow: string; title: string; body: string }
  setup: {
    progressLabel: string
    amountLabel: string
    currencyLabel: string
    amountHelp: string
    amountError: string
    continue: string
    back: string
    scan: string
    horizonTitle: string
    riskTitle: string
    summaryTitle: string
    amountSummary: string
    horizonSummary: string
    riskSummary: string
    horizons: Record<'daily' | 'weekly' | 'monthly', string>
    risks: Record<'low' | 'balanced' | 'high', string>
  }
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
  setup: {
    progressLabel: 'Kurulum ilerlemesi',
    amountLabel: 'Değerlendirilecek tutar',
    currencyLabel: 'Para birimi',
    amountHelp: 'Ondalık ayırıcı olarak virgül veya nokta kullanabilirsin.',
    amountError: 'Sıfırdan büyük, geçerli bir tutar gir.',
    continue: 'Devam et',
    back: 'Geri',
    scan: 'Piyasaları tara',
    horizonTitle: 'Ne kadar bekleyebilirsin?',
    riskTitle: 'Ne kadar risk kabul edersin?',
    summaryTitle: 'Analiz özeti',
    amountSummary: 'Tutar',
    horizonSummary: 'Vade',
    riskSummary: 'Risk',
    horizons: { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' },
    risks: { low: 'Düşük', balanced: 'Dengeli', high: 'Yüksek' },
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
  setup: {
    progressLabel: 'Setup progress',
    amountLabel: 'Amount to evaluate',
    currencyLabel: 'Currency',
    amountHelp: 'Use a comma or period as the decimal separator for your locale.',
    amountError: 'Enter a valid amount greater than zero.',
    continue: 'Continue',
    back: 'Back',
    scan: 'Scan markets',
    horizonTitle: 'How long can you wait?',
    riskTitle: 'How much risk can you accept?',
    summaryTitle: 'Analysis summary',
    amountSummary: 'Amount',
    horizonSummary: 'Horizon',
    riskSummary: 'Risk',
    horizons: { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' },
    risks: { low: 'Low', balanced: 'Balanced', high: 'High' },
  },
}

export const copy = { 'tr-TR': tr, 'en-US': en } as const

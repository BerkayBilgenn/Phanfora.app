export type Locale = 'tr-TR' | 'en-US'

type Copy = {
  skip: string
  navLabel: string
  languageLabel: string
  languages: { tr: string; en: string }
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
  scan: {
    eyebrow: string
    title: string
    body: string
    fixtureNotice: string
    completeTitle: string
    errorTitle: string
    error: string
    retry: string
    edit: string
    stages: Record<'updating' | 'filtering' | 'risk' | 'ranking', string>
  }
  results: {
    title: string
    score: string
    confidence: string
    confidenceLevels: Record<'low' | 'medium' | 'high', string>
    assetClasses: Record<'stock' | 'crypto' | 'commodity' | 'forex' | 'index', string>
    reasonsLabel: string
    riskLabel: string
    demoData: string
    inspect: string
    watch: string
    watchDisabled: string
    scoreDisclosure: string
    dimensions: Record<'trend' | 'momentum' | 'liquidity' | 'risk' | 'market', string>
    weight: string
    contribution: string
    methodology: string
    dataTime: string
    methodologyLink: string
    alternatives: string
    amount: string
    horizon: string
    risk: string
    horizons: Record<'daily' | 'weekly' | 'monthly', string>
    risks: Record<'low' | 'balanced' | 'high', string>
    coverage: (scanned: number, excluded: number) => string
    assetNarratives: Record<string, { reasons: readonly string[]; risk: string }>
  }
  methodology: {
    eyebrow: string
    title: string
    body: string
    dimensionsTitle: string
    dimensionsBody: string
    weightsTitle: string
    weightsBody: string
    qualityTitle: string
    qualityBody: string
    confidenceTitle: string
    confidenceBody: string
    fixtureTitle: string
    fixtureBody: string
  }
}

const tr: Copy = {
  skip: 'İçeriğe geç',
  navLabel: 'Ana navigasyon',
  languageLabel: 'Dil',
  languages: { tr: 'Türkçe', en: 'English' },
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
  scan: {
    eyebrow: 'Deterministik analiz',
    title: 'Piyasalar taranıyor',
    body: 'Her adım gerçek fixture verisi üzerinde tamamlandığında işaretlenir.',
    fixtureNotice: 'Demo verisi',
    completeTitle: 'Öne çıkan fırsat',
    errorTitle: 'Analiz tamamlanamadı',
    error: 'Güvenilir üç sonuç üretilemedi. Seçimlerin korundu; yeniden deneyebilirsin.',
    retry: 'Yeniden dene',
    edit: 'Seçimleri düzenle',
    stages: {
      updating: 'Piyasalar güncelleniyor',
      filtering: 'Varlıklar filtreleniyor',
      risk: 'Risk uyumu hesaplanıyor',
      ranking: 'Sonuçlar sıralanıyor',
    },
  },
  results: {
    title: 'Öne çıkan fırsat',
    score: 'Phanfora Skoru',
    confidence: 'Güven',
    confidenceLevels: { low: 'Düşük', medium: 'Orta', high: 'Yüksek' },
    assetClasses: { stock: 'Hisse', crypto: 'Kripto', commodity: 'Emtia', forex: 'Döviz', index: 'Endeks' },
    reasonsLabel: 'Neden öne çıkıyor?',
    riskLabel: 'Temel risk',
    demoData: 'Demo verisi',
    inspect: 'Analizi incele',
    watch: 'İzlemeye ekle',
    watchDisabled: 'Hesap özelliği sonraki ürün fazında',
    scoreDisclosure: 'Skor nasıl hesaplandı?',
    dimensions: { trend: 'Trend', momentum: 'Momentum', liquidity: 'Hacim ve likidite', risk: 'Risk uyumu', market: 'Piyasa koşulları' },
    weight: 'Ağırlık',
    contribution: 'Katkı',
    methodology: 'Metodoloji',
    dataTime: 'Veri zamanı',
    methodologyLink: 'Metodolojiyi incele',
    alternatives: 'Güçlü alternatifler',
    amount: 'Tutar',
    horizon: 'Vade',
    risk: 'Risk',
    horizons: { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' },
    risks: { low: 'Düşük', balanced: 'Dengeli', high: 'Yüksek' },
    coverage: (scanned, excluded) => `${scanned} varlık tarandı · ${excluded} varlık veri kalitesi nedeniyle elendi`,
    assetNarratives: {
      'apple-stock': { reasons: ['Haftalık trend ana ortalamaların üzerinde.', 'Likidite güçlü ve fiyatlama istikrarlı.', 'Momentum pozitif bölgede korunuyor.'], risk: 'Değerleme çarpanları tarihsel ortalamanın üzerinde.' },
      'gold-commodity': { reasons: ['Haftalık trend yukarı yönünü koruyor.', 'Risk boyutu dengeli profil ile uyumlu.', 'Piyasa koşulları savunmacı talebi destekliyor.'], risk: 'Dolar güçlenmesi kısa vadeli baskı yaratabilir.' },
      'bitcoin-crypto': { reasons: ['Momentum haftalık vadede güçlü kalıyor.', 'Küresel likidite derinliği yüksek.', 'Trend yapısı daha yüksek dipler üretiyor.'], risk: 'Yüksek oynaklık sert geri çekilme yaratabilir.' },
      'high-volatility': { reasons: ['Momentum seçili vadede güçlü.', 'Trend yapısı pozitif bölgede.'], risk: 'Oynaklık düşük risk profiliyle uyumsuz olabilir.' },
    },
  },
  methodology: {
    eyebrow: 'Şeffaf metodoloji',
    title: 'Skorun arkasındaki beş boyut',
    body: 'Phanfora Skoru bir varlığın genel kalitesini değil, seçilen tutar, vade ve risk için göreli uygunluğunu ölçer.',
    dimensionsTitle: 'Beş açıklanabilir boyut',
    dimensionsBody: 'Trend, momentum, hacim ve likidite, risk uyumu ve piyasa koşulları ayrı puanlanır.',
    weightsTitle: 'Haftalık ağırlıklar',
    weightsBody: 'Trend %25, momentum %25, hacim ve likidite %20, risk uyumu %20 ve piyasa koşulları %10 katkı sağlar.',
    qualityTitle: 'Kalite kapısı',
    qualityBody: 'Eski veya %98 altında tamamlanmış veri skor üretmeden önce elenir.',
    confidenceTitle: 'Skor ve güven farklıdır',
    confidenceBody: 'Yüksek skor güçlü uygunluğu; güven ise veri kapsamı ve sinyallerin tutarlılığını anlatır.',
    fixtureTitle: 'Faz 1 sınırlaması',
    fixtureBody: 'Bu sürüm yalnızca sabit, deterministik demo verisi kullanır; canlı piyasa verisi sunmaz.',
  },
}

const en: Copy = {
  skip: 'Skip to content',
  navLabel: 'Primary navigation',
  languageLabel: 'Language',
  languages: { tr: 'Türkçe', en: 'English' },
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
  scan: {
    eyebrow: 'Deterministic analysis',
    title: 'Scanning markets',
    body: 'Each stage is marked only after it completes against fixture data.',
    fixtureNotice: 'Demo data',
    completeTitle: 'Featured opportunity',
    errorTitle: 'Analysis could not be completed',
    error: 'Three reliable results could not be produced. Your choices are saved; you can try again.',
    retry: 'Try again',
    edit: 'Edit choices',
    stages: {
      updating: 'Updating markets',
      filtering: 'Filtering assets',
      risk: 'Calculating risk fit',
      ranking: 'Ranking results',
    },
  },
  results: {
    title: 'Featured opportunity',
    score: 'Phanfora Score',
    confidence: 'Confidence',
    confidenceLevels: { low: 'Low', medium: 'Medium', high: 'High' },
    assetClasses: { stock: 'Stock', crypto: 'Crypto', commodity: 'Commodity', forex: 'Forex', index: 'Index' },
    reasonsLabel: 'Why it stands out',
    riskLabel: 'Primary risk',
    demoData: 'Demo data',
    inspect: 'Review analysis',
    watch: 'Add to watchlist',
    watchDisabled: 'Account features arrive in a later product phase',
    scoreDisclosure: 'How was the score calculated?',
    dimensions: { trend: 'Trend', momentum: 'Momentum', liquidity: 'Volume and liquidity', risk: 'Risk fit', market: 'Market conditions' },
    weight: 'Weight',
    contribution: 'Contribution',
    methodology: 'Methodology',
    dataTime: 'Data time',
    methodologyLink: 'Review methodology',
    alternatives: 'Strong alternatives',
    amount: 'Amount',
    horizon: 'Horizon',
    risk: 'Risk',
    horizons: { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' },
    risks: { low: 'Low', balanced: 'Balanced', high: 'High' },
    coverage: (scanned, excluded) => `${scanned} assets scanned · ${excluded} excluded by data quality`,
    assetNarratives: {
      'apple-stock': { reasons: ['The weekly trend remains above its core averages.', 'Liquidity is strong and pricing remains orderly.', 'Momentum remains in positive territory.'], risk: 'Valuation multiples remain above their historical average.' },
      'gold-commodity': { reasons: ['The weekly trend continues upward.', 'The risk dimension fits a balanced profile.', 'Market conditions support defensive demand.'], risk: 'A stronger dollar may create short-term pressure.' },
      'bitcoin-crypto': { reasons: ['Momentum remains strong on the weekly horizon.', 'Global liquidity depth is high.', 'The trend continues to form higher lows.'], risk: 'High volatility can cause a sharp pullback.' },
      'high-volatility': { reasons: ['Momentum is strong for the selected horizon.', 'The trend structure remains positive.'], risk: 'Volatility may not suit a low-risk profile.' },
    },
  },
  methodology: {
    eyebrow: 'Transparent methodology',
    title: 'Five dimensions behind the score',
    body: 'The Phanfora Score measures relative fit for the selected amount, horizon, and risk—not an asset’s universal quality.',
    dimensionsTitle: 'Five explainable dimensions',
    dimensionsBody: 'Trend, momentum, volume and liquidity, risk fit, and market conditions are scored separately.',
    weightsTitle: 'Weekly weights',
    weightsBody: 'Trend contributes 25%, momentum 25%, volume and liquidity 20%, risk fit 20%, and market conditions 10%.',
    qualityTitle: 'Quality gate',
    qualityBody: 'Stale data or data below 98% completeness is removed before a score is produced.',
    confidenceTitle: 'Score and confidence are different',
    confidenceBody: 'A high score indicates strong fit; confidence reflects data coverage and signal agreement.',
    fixtureTitle: 'Phase 1 limitation',
    fixtureBody: 'This release uses fixed deterministic demo data only; it does not provide live market data.',
  },
}

export const copy = { 'tr-TR': tr, 'en-US': en } as const

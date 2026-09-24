'use client';

import { useEffect, useState } from 'react';

import type { AnalysisInput, AnalysisResult, CurrencyDefinition } from '@phanfora/domain';

import { AnalysisWizard } from '@/components/analysis-wizard';
import { createAnalysis, fetchCurrencies } from '@/lib/api';

export default function TodayPage() {
  const [currencies, setCurrencies] = useState<CurrencyDefinition[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchCurrencies().then(setCurrencies).catch(() => {
      setCurrencies([
        { code: 'TRY', name: 'Türk Lirası', symbol: '₺', minorUnits: 2 },
        { code: 'USD', name: 'ABD Doları', symbol: '$', minorUnits: 2 },
        { code: 'EUR', name: 'Euro', symbol: '€', minorUnits: 2 },
      ]);
    });
  }, []);

  async function handleSubmit(input: AnalysisInput) {
    setBusy(true);
    setError('');
    try {
      setResult(await createAnalysis(input));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Analiz tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return <div className="temporary-result"><p className="eyebrow">Analiz tamamlandı</p><h1>{result.primary.asset.name}</h1><button type="button" onClick={() => setResult(null)}>Yeni analiz</button></div>;
  }

  return (
    <div className="today-layout">
      <section className="today-intro">
        <p className="eyebrow">24 Eylül · Küresel piyasalar</p>
        <h2>Bugünün fırsatlarını kendi koşullarınla değerlendir.</h2>
        <p>Phanfora, beş varlık sınıfını aynı veri kalitesi kurallarıyla karşılaştırır. Sonuç bir işlem talimatı değil, araştırma önceliğidir.</p>
        <div className="coverage-strip" aria-label="Tarama kapsamı">
          <span><b>05</b> varlık sınıfı</span><span><b>150+</b> para birimi</span><span><b>v1</b> metodoloji</span>
        </div>
      </section>
      <AnalysisWizard currencies={currencies} onSubmit={handleSubmit} busy={busy} />
      {error ? <p className="page-error" role="alert">{error}</p> : null}
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';

import { parseMoneyInput } from '@phanfora/currency';
import type { AnalysisInput, CurrencyDefinition, Horizon, RiskProfile } from '@phanfora/domain';

import { CurrencyCombobox } from './currency-combobox';

interface AnalysisPanelProps {
  currencies: readonly CurrencyDefinition[];
  onSubmit: (input: AnalysisInput) => void | Promise<void>;
  busy?: boolean;
}

const horizons: { value: Horizon; title: string; description: string }[] = [
  { value: 'daily', title: 'Günlük', description: '15 dakikalık piyasa hareketleri' },
  { value: 'weekly', title: 'Haftalık', description: 'Saatlik piyasa yapısı' },
  { value: 'monthly', title: 'Aylık', description: 'Günlük orta vade görünümü' },
];

const risks: { value: RiskProfile; title: string; description: string }[] = [
  { value: 'low', title: 'Düşük', description: 'İstikrar ve likidite öncelikli' },
  { value: 'balanced', title: 'Dengeli', description: 'Fırsat ile risk arasında denge' },
  { value: 'high', title: 'Yüksek', description: 'Daha geniş fiyat hareketlerine açık' },
];

export function AnalysisPanel({ currencies, onSubmit, busy = false }: AnalysisPanelProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [horizon, setHorizon] = useState<Horizon>('daily');
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('balanced');
  const [error, setError] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  async function submit() {
    let money;
    try {
      money = parseMoneyInput(amount, currency, 'tr-TR');
      if (!currencies.some((item) => item.code === currency)) {
        throw new Error('UNSUPPORTED_CURRENCY');
      }
    } catch {
      setError('Geçerli bir tutar gir ve listeden bir para birimi seç.');
      amountRef.current?.focus();
      return;
    }

    setError('');
    await onSubmit({ amount: money, horizon, riskProfile, locale: 'tr-TR' });
  }

  return (
    <section className="analysis-panel wizard" aria-labelledby="analysis-panel-title">
      <div className="wizard-heading">
        <div>
          <p className="eyebrow">Yeni analiz</p>
          <h2 id="analysis-panel-title">Analiz ayarları</h2>
        </div>
        <div className="analysis-coverage" aria-label="Canlı analiz kapsamı">
          <span>6 canlı enstrüman</span>
          <span>4 varlık sınıfı</span>
        </div>
      </div>

      <div className="analysis-fields">
        <div className="amount-field">
          <label htmlFor="analysis-amount">Değerlendirilecek tutar</label>
          <input
            ref={amountRef}
            id="analysis-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="25.000"
            value={amount}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'amount-error' : 'amount-hint'}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <CurrencyCombobox currencies={currencies} value={currency} onChange={setCurrency} />
        <p id="amount-hint" className="field-hint">Tutar yalnızca fırsatları karşılaştırmak için kullanılır.</p>
        {error ? <p id="amount-error" className="field-error" role="alert">{error}</p> : null}
      </div>

      <div className="analysis-choices">
        <fieldset className="choice-grid compact-choice-grid">
          <legend>Analiz vadesi</legend>
          {horizons.map((item) => (
            <label key={item.value} className="choice-card">
              <input type="radio" name="horizon" value={item.value} checked={horizon === item.value} onChange={() => setHorizon(item.value)} />
              <span className="choice-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
              <span className="choice-indicator" aria-hidden="true" />
            </label>
          ))}
        </fieldset>

        <fieldset className="choice-grid compact-choice-grid">
          <legend>Risk profili</legend>
          {risks.map((item) => (
            <label key={item.value} className="choice-card">
              <input type="radio" name="risk" value={item.value} checked={riskProfile === item.value} onChange={() => setRiskProfile(item.value)} />
              <span className="choice-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
              <span className="choice-indicator" aria-hidden="true" />
            </label>
          ))}
        </fieldset>
      </div>

      <div className="wizard-actions">
        <span />
        <button type="button" className="button-primary" disabled={busy} onClick={() => void submit()}>
          {busy ? 'Piyasalar analiz ediliyor' : 'Canlı piyasaları analiz et'}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  );
}

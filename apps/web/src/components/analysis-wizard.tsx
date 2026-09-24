'use client';

import { useRef, useState } from 'react';

import { parseMoneyInput } from '@phanfora/currency';
import type { AnalysisInput, CurrencyDefinition, Horizon, RiskProfile } from '@phanfora/domain';

import { CurrencyCombobox } from './currency-combobox';

interface AnalysisWizardProps {
  currencies: readonly CurrencyDefinition[];
  onSubmit: (input: AnalysisInput) => void | Promise<void>;
  busy?: boolean;
}

const horizons: { value: Horizon; title: string; description: string }[] = [
  { value: 'daily', title: 'Günlük', description: 'Saatler ve gün içi hareketler' },
  { value: 'weekly', title: 'Haftalık', description: 'Birkaç gün ile birkaç hafta' },
  { value: 'monthly', title: 'Aylık', description: 'Orta vadeli piyasa yapısı' },
];

const risks: { value: RiskProfile; title: string; description: string }[] = [
  { value: 'low', title: 'Düşük', description: 'İstikrar ve likidite öncelikli' },
  { value: 'balanced', title: 'Dengeli', description: 'Fırsat ile risk arasında denge' },
  { value: 'high', title: 'Yüksek', description: 'Daha geniş fiyat hareketlerine açık' },
];

export function AnalysisWizard({ currencies, onSubmit, busy = false }: AnalysisWizardProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [horizon, setHorizon] = useState<Horizon>('daily');
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('balanced');
  const [error, setError] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  function continueFromAmount() {
    try {
      parseMoneyInput(amount, currency, 'tr-TR');
      if (!currencies.some((item) => item.code === currency)) {
        throw new Error('UNSUPPORTED_CURRENCY');
      }
      setError('');
      setStep(2);
    } catch {
      setError('Geçerli bir tutar gir ve listeden bir para birimi seç.');
      amountRef.current?.focus();
    }
  }

  async function submit() {
    let money;
    try {
      money = parseMoneyInput(amount, currency, 'tr-TR');
    } catch {
      setStep(1);
      setError('Geçerli bir tutar gir.');
      return;
    }
    await onSubmit({ amount: money, horizon, riskProfile, locale: 'tr-TR' });
  }

  return (
    <section className="wizard" aria-labelledby="wizard-title">
      <div className="wizard-heading">
        <div>
          <p className="eyebrow">Yeni analiz</p>
          <h1 id="wizard-title">
            {step === 1 && 'Ne kadar değerlendirmek istiyorsun?'}
            {step === 2 && 'Ne kadar bekleyebilirsin?'}
            {step === 3 && 'Risk yaklaşımın nasıl?'}
          </h1>
        </div>
        <span className="step-count" aria-label={`Adım ${step} / 3`}>{step} / 3</span>
      </div>

      <div className="step-track" aria-hidden="true">
        <span style={{ inlineSize: `${(step / 3) * 100}%` }} />
      </div>

      {step === 1 ? (
        <div className="wizard-step amount-step">
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
      ) : null}

      {step === 2 ? (
        <fieldset className="choice-grid">
          <legend>Analiz vadesi</legend>
          {horizons.map((item) => (
            <label key={item.value} className="choice-card">
              <input type="radio" name="horizon" value={item.value} checked={horizon === item.value} onChange={() => setHorizon(item.value)} />
              <span className="choice-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
              <span className="choice-indicator" aria-hidden="true" />
            </label>
          ))}
        </fieldset>
      ) : null}

      {step === 3 ? (
        <fieldset className="choice-grid">
          <legend>Risk profili</legend>
          {risks.map((item) => (
            <label key={item.value} className="choice-card">
              <input type="radio" name="risk" value={item.value} checked={riskProfile === item.value} onChange={() => setRiskProfile(item.value)} />
              <span className="choice-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
              <span className="choice-indicator" aria-hidden="true" />
            </label>
          ))}
        </fieldset>
      ) : null}

      <div className="wizard-actions">
        {step > 1 ? <button type="button" className="button-secondary" onClick={() => setStep((value) => value - 1)}>Geri</button> : <span />}
        {step < 3 ? (
          <button type="button" className="button-primary" onClick={step === 1 ? continueFromAmount : () => setStep(3)}>Devam et <span aria-hidden="true">→</span></button>
        ) : (
          <button type="button" className="button-primary" disabled={busy} onClick={() => void submit()}>{busy ? 'Tarama başlatılıyor' : 'Piyasaları tara'} <span aria-hidden="true">↗</span></button>
        )}
      </div>
    </section>
  );
}

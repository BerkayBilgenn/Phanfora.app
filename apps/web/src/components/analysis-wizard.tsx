"use client";

import { useRef, useState } from "react";

import { parseMoneyInput } from "@phanfora/currency";
import type {
  AnalysisInput,
  CurrencyDefinition,
  Horizon,
  RiskProfile,
} from "@phanfora/domain";

import { CurrencyCombobox } from "./currency-combobox";

interface AnalysisPanelProps {
  currencies: readonly CurrencyDefinition[];
  onSubmit: (input: AnalysisInput) => void | Promise<void>;
  busy?: boolean;
  marketCount?: number;
  classCount?: number;
  initialHorizon?: Horizon;
  initialRiskProfile?: RiskProfile;
}

const horizons: readonly { value: Horizon; label: string; detail: string }[] = [
  { value: "daily", label: "Günlük", detail: "Kısa vade" },
  { value: "weekly", label: "Haftalık", detail: "Orta vade" },
  { value: "monthly", label: "Aylık", detail: "Uzun vade" },
];

const risks: readonly { value: RiskProfile; label: string; detail: string }[] =
  [
    { value: "low", label: "Düşük", detail: "Temkinli" },
    { value: "balanced", label: "Dengeli", detail: "Orta seviye" },
    { value: "high", label: "Yüksek", detail: "Atak" },
  ];

export function AnalysisPanel({
  currencies,
  onSubmit,
  busy = false,
  marketCount,
  classCount,
  initialHorizon = 'daily',
  initialRiskProfile = 'balanced',
}: AnalysisPanelProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("TRY");
  const [horizon, setHorizon] = useState<Horizon>(initialHorizon);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>(initialRiskProfile);
  const [error, setError] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let money: AnalysisInput["amount"];
    try {
      money = parseMoneyInput(amount, currency, "tr-TR");
      if (!currencies.some((item) => item.code === currency))
        throw new Error("UNSUPPORTED_CURRENCY");
    } catch {
      setError("Geçerli bir tutar gir ve listeden bir para birimi seç.");
      amountRef.current?.focus();
      return;
    }
    setError("");
    void onSubmit({ amount: money, horizon, riskProfile, locale: "tr-TR" });
  }

  return (
    <form className="analysis-panel" onSubmit={submit} noValidate>
      <div className="analysis-panel-heading">
        <div>
          <p className="eyebrow">PHANFORA ANALİZİ</p>
          <h2>Analiz ayarları</h2>
        </div>
        <p>Koşullarını belirle, piyasayı tara.</p>
      </div>
      <div className="analysis-fields">
        <div className="amount-field">
          <label htmlFor="analysis-amount">Değerlendirilecek tutar</label>
          <input
            ref={amountRef}
            id="analysis-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="25.000"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={Boolean(error)}
          />
        </div>
        <CurrencyCombobox
          currencies={currencies}
          value={currency}
          onChange={setCurrency}
        />
      </div>
      <fieldset className="analysis-choices">
        <legend>Analiz vadesi</legend>
        <div>
          {horizons.map((item) => (
            <label key={item.value} className="analysis-choice">
              <input
                type="radio"
                name="horizon"
                value={item.value}
                checked={horizon === item.value}
                onChange={() => setHorizon(item.value)}
              />
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="analysis-choices">
        <legend>Risk profili</legend>
        <div>
          {risks.map((item) => (
            <label key={item.value} className="analysis-choice">
              <input
                type="radio"
                name="risk"
                value={item.value}
                checked={riskProfile === item.value}
                onChange={() => setRiskProfile(item.value)}
              />
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {(marketCount !== undefined || classCount !== undefined) && <div className="analysis-panel-foot">
        {marketCount !== undefined && <span>{marketCount} enstrüman</span>}
        {classCount !== undefined && <span>{classCount} varlık sınıfı</span>}
      </div>}
      {error ? (
        <p className="panel-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="button-primary analysis-submit"
        type="submit"
        disabled={busy}
      >
        {busy ? "Piyasalar analiz ediliyor" : "Canlı piyasaları analiz et"}{" "}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}

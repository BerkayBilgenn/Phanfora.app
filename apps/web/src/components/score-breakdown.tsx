import type { ScoreResult } from '@phanfora/domain';

const dimensionLabels: [keyof ScoreResult['dimensionScores'], string][] = [
  ['trend', 'Trend'],
  ['momentum', 'Momentum'],
  ['liquidity', 'Hacim ve likidite'],
  ['riskFit', 'Risk uyumu'],
  ['marketConditions', 'Piyasa koşulları'],
];

export function ScoreBreakdown({ result }: { result: ScoreResult }) {
  return (
    <details className="score-disclosure">
      <summary>Skor nasıl hesaplandı?<span aria-hidden="true">＋</span></summary>
      <div className="score-breakdown" data-testid="score-breakdown">
        <div className="method-row"><span>Metodoloji</span><strong>{result.methodologyVersion}</strong></div>
        {dimensionLabels.map(([key, label]) => (
          <div className="dimension-row" data-testid="dimension-row" key={key}>
            <span>{label}</span>
            <div className="dimension-track" aria-hidden="true"><i style={{ inlineSize: `${result.dimensionScores[key]}%` }} /></div>
            <strong>{result.dimensionScores[key]}</strong>
          </div>
        ))}
      </div>
    </details>
  );
}

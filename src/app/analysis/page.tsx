import { AppShell } from '@/components/app-shell'
import { fixtureAnalysisService } from '@/features/analysis/fixture-analysis-service'
import { ResultsView } from '@/features/analysis/results-view'

export default async function AnalysisPage() {
  const result = await fixtureAnalysisService.run({
    amount: '5000',
    currency: 'USD',
    horizon: 'weekly',
    riskProfile: 'balanced',
  }, () => undefined)

  return (
    <AppShell>
      <ResultsView result={result} locale="tr-TR" />
    </AppShell>
  )
}

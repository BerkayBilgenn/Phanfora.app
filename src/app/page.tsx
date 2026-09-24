import { AppShell } from '@/components/app-shell'
import { AnalysisExperience } from '@/features/analysis/analysis-experience'

export default function HomePage() {
  return (
    <AppShell>
      <AnalysisExperience locale="tr-TR" />
    </AppShell>
  )
}

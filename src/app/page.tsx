import { AppShell } from '@/components/app-shell'
import { SetupWizard } from '@/features/analysis/setup-wizard'

export default function HomePage() {
  return (
    <AppShell>
      <SetupWizard locale="tr-TR" />
    </AppShell>
  )
}

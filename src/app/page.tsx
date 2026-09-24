import { AppShell } from '@/components/app-shell'
import { copy } from '@/lib/copy'

export default function HomePage() {
  const text = copy['tr-TR'].hero

  return (
    <AppShell>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1 id="hero-title">{text.title}</h1>
        <p className="hero-body">{text.body}</p>
      </section>
    </AppShell>
  )
}

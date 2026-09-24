import { AppShell } from '@/components/app-shell'
import { copy, type Locale } from '@/lib/copy'

function MethodologyArticle({ locale }: { locale: Locale }) {
  const text = copy[locale].methodology
  return (
    <article className="methodology-article" lang={locale === 'tr-TR' ? 'tr' : 'en'}>
      <p className="eyebrow">{text.eyebrow}</p>
      <h1>{text.title}</h1>
      <p className="methodology-lead">{text.body}</p>
      {(['dimensions', 'weights', 'quality', 'confidence', 'fixture'] as const).map((section) => (
        <section key={section}>
          <h2>{text[`${section}Title`]}</h2>
          <p>{text[`${section}Body`]}</p>
        </section>
      ))}
    </article>
  )
}

export default function MethodologyPage() {
  return (
    <AppShell>
      <div className="methodology-page">
        <MethodologyArticle locale="tr-TR" />
        <MethodologyArticle locale="en-US" />
      </div>
    </AppShell>
  )
}

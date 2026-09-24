# Phanfora App Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-quality vertical slice of Phanfora App: the branded application shell, amount–horizon–risk setup flow, a real deterministic fixture scan, and explainable opportunity results.

**Architecture:** Use a Next.js App Router application with feature-focused TypeScript modules. Keep product logic independent from React through typed domain contracts and an `AnalysisService` boundary; Phase 1 uses deterministic market fixtures while preserving the interface that the later live-data and scoring plans will implement. Render a server-owned shell and small client islands for the setup flow, scan state, charts, and disclosures.

**Tech Stack:** Node.js 22, npm, Next.js App Router, React, TypeScript strict mode, Tailwind CSS v4, Zod, Lucide React, Vitest, React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-24-phanfora-app-product-design.md`

## Global Constraints

- Execute this plan in the empty `BerkayBilgenn/Phanfora.app` repository, not inside the landing-page repository.
- Copy the spec and this plan into the same paths in `Phanfora.app` before Task 1 so future work travels with the application.
- `phanfora.com` remains the independently deployed landing page; this application targets `app.phanfora.com`.
- Use Node.js 22 and commit `22` in `.nvmrc`; do not depend on machine-global package versions.
- Use TypeScript strict mode and the `@/*` alias; do not introduce `any` or suppress type errors.
- Use Server Components by default. Add `'use client'` only to the smallest interactive boundary.
- All user-visible copy ships in Turkish and English through typed dictionaries; no inline UI strings outside the copy modules.
- Use Manrope `.woff2` files locally; dynamic prices, percentages, times, and scores use tabular numerals.
- Preserve the approved dark palette: canvas `#0c1013`, surface `#11171c`, raised surface `#171f25`, primary text `#edf1f2`, secondary text `#a2adb5`, accent `#83c9ad`, action `#9bd8be`, action ink `#0c211a`, divider `#ffffff14`.
- The result surface shows one primary opportunity and two alternatives. It must never use guaranteed-return language or present “Buy”/“Sell” as a primary action.
- A result always includes total score, five dimension scores, confidence, up to three reasons, one primary risk, methodology version, and data time.
- No score renders when data freshness or completeness fails the quality gate.
- Phase 1 contains no live provider, authentication, database, order execution, portfolio custody, or free-form chatbot.
- Respect `prefers-reduced-motion`, maintain visible focus, preserve 44 × 44 px control targets, and keep mobile input text at 16 px or larger.
- Never use `transition: all`; motion must name exact properties.
- Use real deterministic fixture computations. Do not simulate scan progress with arbitrary timers.

## Scope Decomposition

The full product spec contains multiple independent subsystems and is intentionally split into five implementation plans:

1. **Foundation — this plan:** application shell, design system, setup flow, deterministic fixture scan, results and methodology UI.
2. **Market data:** provider adapters, canonical assets, snapshots, freshness and quality gates.
3. **Scoring engine:** indicators, category normalization, horizon weights, risk penalties, confidence and methodology versioning.
4. **Accounts and persistence:** authentication, preferences, analysis history, watchlist and deletion.
5. **Production integration:** job queue, caching, live results, observability, security review, localization QA and deployment.

Each plan must end in independently runnable software. Phase 1 proves the complete user experience without pretending fixture data is live.

## Review Focus

- **Locale-formatted amounts:** `1.250,50` in Turkish and `1,250.50` in English normalize to the same canonical decimal without floating-point arithmetic; Task 2 owns the tests.
- **Stale or incomplete data:** a high raw score never escapes the quality gate when freshness or completeness is invalid; Task 5 owns the tests.
- **Repeated navigation:** moving backward and forward in the setup flow preserves valid answers and clears only the field the user changes; Task 4 owns the tests.
- **Long localized copy and narrow screens:** no primary action, price, score, or risk message clips at 320 px or 200% zoom; Task 7 owns the browser tests.
- **Reduced motion and keyboard-only use:** the complete setup-to-result journey works without pointer input or decorative motion; Tasks 4 and 7 own the tests.

---

## Planned File Structure

```text
Phanfora.app/
├── .nvmrc
├── README.md
├── package.json
├── playwright.config.ts
├── vitest.config.mts
├── vitest.setup.ts
├── public/
│   ├── fonts/manrope-latin.woff2
│   └── mark.svg
├── docs/superpowers/
│   ├── specs/2026-09-24-phanfora-app-product-design.md
│   └── plans/2026-09-24-phanfora-app-foundation.md
├── e2e/
│   ├── setup-to-result.spec.ts
│   └── accessibility-layout.spec.ts
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── analysis/page.tsx
    │   └── methodology/page.tsx
    ├── components/
    │   ├── app-shell.tsx
    │   ├── brand-mark.tsx
    │   ├── icon-button.tsx
    │   └── skip-link.tsx
    ├── features/analysis/
    │   ├── analysis-contract.ts
    │   ├── analysis-contract.test.ts
    │   ├── analysis-service.ts
    │   ├── fixture-analysis-service.ts
    │   ├── fixture-analysis-service.test.ts
    │   ├── fixtures.ts
    │   ├── setup-reducer.ts
    │   ├── setup-reducer.test.ts
    │   ├── setup-wizard.tsx
    │   ├── setup-wizard.test.tsx
    │   ├── scan-view.tsx
    │   ├── results-view.tsx
    │   ├── opportunity-card.tsx
    │   ├── opportunity-card.test.tsx
    │   ├── price-line-chart.tsx
    │   ├── score-breakdown.tsx
    │   └── analysis-experience.tsx
    └── lib/
        ├── copy.ts
        ├── format.ts
        └── format.test.ts
```

## Task 1: Bootstrap the Application and Quality Gates

**Files:**
- Create: `.nvmrc`
- Create: `package.json` and standard `create-next-app` configuration files
- Create: `vitest.config.mts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/page.test.tsx`
- Create: `README.md`

**Interfaces:**
- Consumes: Node.js 22 and an empty Git repository.
- Produces: `npm run dev`, `npm run test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`, and `npm run build` quality gates used by every later task.

- [ ] **Step 1: Copy the approved documents into the new repository**

Create these exact files in the new repo before scaffolding:

```text
docs/superpowers/specs/2026-09-24-phanfora-app-product-design.md
docs/superpowers/plans/2026-09-24-phanfora-app-foundation.md
```

Verify:

```bash
test -s docs/superpowers/specs/2026-09-24-phanfora-app-product-design.md
test -s docs/superpowers/plans/2026-09-24-phanfora-app-foundation.md
```

Expected: both commands exit `0`.

- [ ] **Step 2: Scaffold Next.js in the repository root**

Run:

```bash
npx create-next-app@latest . --typescript --eslint --tailwind --app --src-dir --import-alias '@/*' --use-npm
npm install zod lucide-react
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths @playwright/test
npx playwright install chromium
```

When `create-next-app` asks about React Compiler, select **No** for Phase 1 so compilation behavior does not add another variable to the first vertical slice.

Create `.nvmrc` with exactly:

```text
22
```

- [ ] **Step 3: Add deterministic test configuration**

Create `vitest.config.mts`:

```ts
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    clearMocks: true,
  },
})
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
})
```

Add these scripts to `package.json` without removing the generated scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit",
    "check": "npm run lint && npm run typecheck && npm run test && npm run build"
  }
}
```

- [ ] **Step 4: Write the failing smoke test**

Create `src/app/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HomePage from './page'

describe('HomePage', () => {
  it('introduces the decision flow', () => {
    render(<HomePage />)
    expect(
      screen.getByRole('heading', { name: 'Piyasaları kendi koşullarına göre tara' }),
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run the smoke test and verify the expected failure**

Run:

```bash
npm run test -- src/app/page.test.tsx
```

Expected: FAIL because the generated page does not contain the Phanfora heading.

- [ ] **Step 6: Replace the generated page with the minimal passing page**

Replace `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>Piyasaları kendi koşullarına göre tara</h1>
    </main>
  )
}
```

- [ ] **Step 7: Run every quality gate**

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 8: Commit the bootstrap**

```bash
git add .nvmrc README.md package.json package-lock.json next.config.ts postcss.config.mjs tsconfig.json eslint.config.mjs vitest.config.mts vitest.setup.ts playwright.config.ts src/app docs/superpowers
git commit -m "chore: bootstrap Phanfora app"
```

## Task 2: Define Analysis Contracts and Locale-Safe Amounts

**Files:**
- Create: `src/features/analysis/analysis-contract.ts`
- Create: `src/features/analysis/analysis-contract.test.ts`
- Create: `src/lib/format.ts`
- Create: `src/lib/format.test.ts`

**Interfaces:**
- Consumes: Zod from Task 1.
- Produces: `analysisInputSchema`, `AnalysisInput`, `Opportunity`, `AnalysisResult`, `normalizeLocalizedAmount()`, `formatMoney()`, and `formatPercent()`.

- [ ] **Step 1: Write failing amount and quality-gate tests**

Create `src/features/analysis/analysis-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { analysisInputSchema, passesQualityGate } from './analysis-contract'

describe('analysisInputSchema', () => {
  it('accepts a canonical decimal amount and complete preferences', () => {
    expect(
      analysisInputSchema.parse({
        amount: '1250.50',
        currency: 'USD',
        horizon: 'weekly',
        riskProfile: 'balanced',
      }),
    ).toEqual({
      amount: '1250.50',
      currency: 'USD',
      horizon: 'weekly',
      riskProfile: 'balanced',
    })
  })

  it('rejects zero, negative and exponential amounts', () => {
    for (const amount of ['0', '-10', '1e6']) {
      expect(() =>
        analysisInputSchema.parse({
          amount,
          currency: 'USD',
          horizon: 'weekly',
          riskProfile: 'balanced',
        }),
      ).toThrow()
    }
  })
})

describe('passesQualityGate', () => {
  it('rejects stale or incomplete snapshots', () => {
    expect(passesQualityGate({ freshness: 'stale', completeness: 1 })).toBe(false)
    expect(passesQualityGate({ freshness: 'fresh', completeness: 0.94 })).toBe(false)
    expect(passesQualityGate({ freshness: 'fresh', completeness: 0.99 })).toBe(true)
  })
})
```

Create `src/lib/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { normalizeLocalizedAmount } from './format'

describe('normalizeLocalizedAmount', () => {
  it('normalizes Turkish and English input without floating-point math', () => {
    expect(normalizeLocalizedAmount('1.250,50', 'tr-TR')).toBe('1250.50')
    expect(normalizeLocalizedAmount('1,250.50', 'en-US')).toBe('1250.50')
  })

  it('returns null for ambiguous or invalid input', () => {
    expect(normalizeLocalizedAmount('1,2,3', 'tr-TR')).toBeNull()
    expect(normalizeLocalizedAmount('-5', 'en-US')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm run test -- src/features/analysis/analysis-contract.test.ts src/lib/format.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the domain contract**

Create `src/features/analysis/analysis-contract.ts` with these exported shapes:

```ts
import { z } from 'zod'

export const currencySchema = z.enum(['USD', 'EUR', 'TRY', 'GBP'])
export const horizonSchema = z.enum(['daily', 'weekly', 'monthly'])
export const riskProfileSchema = z.enum(['low', 'balanced', 'high'])

export const analysisInputSchema = z.object({
  amount: z.string().regex(/^(?!0+(?:\.0+)?$)\d+(?:\.\d{1,2})?$/),
  currency: currencySchema,
  horizon: horizonSchema,
  riskProfile: riskProfileSchema,
})

export type AnalysisInput = z.infer<typeof analysisInputSchema>
export type ScoreDimension = 'trend' | 'momentum' | 'liquidity' | 'risk' | 'market'

export type DataQuality = {
  freshness: 'fresh' | 'delayed' | 'stale'
  completeness: number
}

export type Opportunity = {
  assetId: string
  symbol: string
  name: string
  assetClass: 'stock' | 'crypto' | 'commodity' | 'forex' | 'index'
  venue: string
  quoteCurrency: string
  price: number
  changePercent: number
  totalScore: number
  confidence: 'low' | 'medium' | 'high'
  dimensions: Record<ScoreDimension, number>
  reasons: readonly string[]
  primaryRisk: string
  methodologyVersion: 'fixture-v1'
  observedAt: string
  quality: DataQuality
  series: readonly { time: string; value: number }[]
}

export type AnalysisResult = {
  input: AnalysisInput
  primary: Opportunity
  alternatives: readonly [Opportunity, Opportunity]
  scannedAssetCount: number
  excludedAssetCount: number
}

export function passesQualityGate(quality: DataQuality): boolean {
  return quality.freshness !== 'stale' && quality.completeness >= 0.98
}
```

- [ ] **Step 4: Implement locale-safe formatting**

Create `src/lib/format.ts`:

```ts
export function normalizeLocalizedAmount(value: string, locale: 'tr-TR' | 'en-US') {
  const compact = value.trim().replace(/\s/g, '')
  const normalized =
    locale === 'tr-TR'
      ? compact.replace(/\./g, '').replace(',', '.')
      : compact.replace(/,/g, '')

  if (!/^(?!0+(?:\.0+)?$)\d+(?:\.\d{1,2})?$/.test(normalized)) return null
  return normalized
}

export function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    signDisplay: 'always',
    maximumFractionDigits: 2,
  }).format(value / 100)
}
```

- [ ] **Step 5: Run tests and typecheck**

```bash
npm run test -- src/features/analysis/analysis-contract.test.ts src/lib/format.test.ts
npm run typecheck
```

Expected: all tests pass and typecheck exits `0`.

- [ ] **Step 6: Commit the contracts**

```bash
git add src/features/analysis/analysis-contract.ts src/features/analysis/analysis-contract.test.ts src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: define analysis contracts"
```

## Task 3: Build the Visual Foundation and Application Shell

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/app-shell.tsx`
- Create: `src/components/brand-mark.tsx`
- Create: `src/components/icon-button.tsx`
- Create: `src/components/skip-link.tsx`
- Create: `src/lib/copy.ts`
- Add: `public/fonts/manrope-latin.woff2`
- Add: `public/mark.svg`

**Interfaces:**
- Consumes: approved visual tokens in the spec.
- Produces: `AppShell`, `IconButton`, `SkipLink`, `copy`, and reusable global token classes for later screens.

- [ ] **Step 1: Write a failing shell accessibility test**

Add `src/components/app-shell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

describe('AppShell', () => {
  it('exposes navigation, skip link and main content', () => {
    render(<AppShell><h1>Bugün</h1></AppShell>)
    expect(screen.getByRole('link', { name: 'İçeriğe geç' })).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('navigation', { name: 'Ana navigasyon' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })
})
```

- [ ] **Step 2: Run the shell test and verify it fails**

```bash
npm run test -- src/components/app-shell.test.tsx
```

Expected: FAIL because `AppShell` does not exist.

- [ ] **Step 3: Create typed Turkish and English copy**

Create `src/lib/copy.ts` with `tr` and `en` objects that share this key shape:

```ts
export type Locale = 'tr-TR' | 'en-US'
type Copy = {
  skip: string
  navLabel: string
  nav: { today: string; explore: string; watch: string; history: string }
  hero: { eyebrow: string; title: string; body: string }
}

const tr: Copy = {
  skip: 'İçeriğe geç',
  navLabel: 'Ana navigasyon',
  nav: { today: 'Bugün', explore: 'Keşfet', watch: 'İzleme', history: 'Geçmiş' },
  hero: {
    eyebrow: 'Küresel piyasa analizi',
    title: 'Piyasaları kendi koşullarına göre tara',
    body: 'Tutarını, vadeni ve risk tercihini belirle. Phanfora öne çıkan fırsatları nedenleriyle sıralasın.',
  },
}

const en: Copy = {
  skip: 'Skip to content',
  navLabel: 'Primary navigation',
  nav: { today: 'Today', explore: 'Explore', watch: 'Watchlist', history: 'History' },
  hero: {
    eyebrow: 'Global market analysis',
    title: 'Scan markets on your terms',
    body: 'Set your amount, horizon, and risk preference. Phanfora ranks notable opportunities and explains why.',
  },
}

export const copy = { 'tr-TR': tr, 'en-US': en } as const
```

- [ ] **Step 4: Implement the shell and global design tokens**

Implement `AppShell` as a responsive navigation shell with:

- `SkipLink` as the first focusable control.
- A 72 px desktop rail that collapses to a bottom navigation when content no longer fits.
- One `main#main-content` landmark.
- Lucide outline icons at 1.5 px stroke, with the active destination carrying both a filled surface and an accessible label.
- No hidden navigation actions in Phase 1; disabled destinations are rendered as text with `aria-disabled="true"`, not dead links.

Start `src/app/globals.css` with these exact tokens:

```css
@import "tailwindcss";

@font-face {
  font-family: "Manrope";
  src: url("/fonts/manrope-latin.woff2") format("woff2");
  font-style: normal;
  font-weight: 200 800;
  font-display: swap;
}

:root {
  --canvas: #0c1013;
  --surface: #11171c;
  --surface-raised: #171f25;
  --text-primary: #edf1f2;
  --text-secondary: #a2adb5;
  --accent: #83c9ad;
  --action: #9bd8be;
  --action-ink: #0c211a;
  --divider: #ffffff14;
  --focus: #b7f3d7;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
}

* { box-sizing: border-box; }
html { color-scheme: dark; background: var(--canvas); }
body {
  margin: 0;
  background: var(--canvas);
  color: var(--text-primary);
  font-family: "Manrope", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
button, input { font: inherit; }
button { min-width: 44px; min-height: 44px; }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px; }
.numeric { font-variant-numeric: tabular-nums lining-nums; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

Set root metadata in `src/app/layout.tsx` to title `Phanfora — Global market clarity` and description `Explainable market opportunities matched to amount, horizon, and risk.`

- [ ] **Step 5: Run the component test and build**

```bash
npm run test -- src/components/app-shell.test.tsx
npm run typecheck
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 6: Commit the visual foundation**

```bash
git add public src/app src/components src/lib/copy.ts
git commit -m "feat: add Phanfora application shell"
```

## Task 4: Implement the Amount–Horizon–Risk Setup Flow

**Files:**
- Create: `src/features/analysis/setup-reducer.ts`
- Create: `src/features/analysis/setup-reducer.test.ts`
- Create: `src/features/analysis/setup-wizard.tsx`
- Create: `src/features/analysis/setup-wizard.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/lib/copy.ts`

**Interfaces:**
- Consumes: `AnalysisInput`, `normalizeLocalizedAmount()`, shell tokens, typed copy.
- Produces: `SetupWizard({ locale, onComplete })` and `setupReducer` with preserved backward navigation.

- [ ] **Step 1: Write reducer tests for navigation and preservation**

Create `src/features/analysis/setup-reducer.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { initialSetupState, setupReducer } from './setup-reducer'

describe('setupReducer', () => {
  it('preserves answers across back and next navigation', () => {
    let state = setupReducer(initialSetupState, { type: 'amount', amount: '5000', currency: 'USD' })
    state = setupReducer(state, { type: 'next' })
    state = setupReducer(state, { type: 'horizon', horizon: 'weekly' })
    state = setupReducer(state, { type: 'next' })
    state = setupReducer(state, { type: 'back' })

    expect(state.step).toBe('horizon')
    expect(state.input.amount).toBe('5000')
    expect(state.input.horizon).toBe('weekly')
  })

  it('does not advance until the current step is valid', () => {
    expect(setupReducer(initialSetupState, { type: 'next' }).step).toBe('amount')
  })
})
```

- [ ] **Step 2: Write the failing interaction test**

Create `src/features/analysis/setup-wizard.test.tsx`:

```tsx
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SetupWizard } from './setup-wizard'

describe('SetupWizard', () => {
  it('collects amount, horizon and risk before completing', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<SetupWizard locale="tr-TR" onComplete={onComplete} />)

    await user.type(screen.getByLabelText('Değerlendirilecek tutar'), '5000')
    await user.click(screen.getByRole('button', { name: 'Devam et' }))
    await user.click(screen.getByRole('radio', { name: 'Haftalık' }))
    await user.click(screen.getByRole('button', { name: 'Devam et' }))
    await user.click(screen.getByRole('radio', { name: 'Dengeli' }))
    await user.click(screen.getByRole('button', { name: 'Piyasaları tara' }))

    expect(onComplete).toHaveBeenCalledWith({
      amount: '5000',
      currency: 'USD',
      horizon: 'weekly',
      riskProfile: 'balanced',
    })
  })
})
```

- [ ] **Step 3: Run tests and verify failure**

```bash
npm run test -- src/features/analysis/setup-reducer.test.ts src/features/analysis/setup-wizard.test.tsx
```

Expected: FAIL because reducer and wizard do not exist.

- [ ] **Step 4: Implement the reducer as an explicit state machine**

Create `setup-reducer.ts` with:

```ts
import type { AnalysisInput } from './analysis-contract'

type Step = 'amount' | 'horizon' | 'risk' | 'summary'
type Draft = Partial<AnalysisInput>
export type SetupState = { step: Step; input: Draft; error: string | null }

export const initialSetupState: SetupState = {
  step: 'amount',
  input: { currency: 'USD' },
  error: null,
}

export type SetupAction =
  | { type: 'amount'; amount: string; currency: AnalysisInput['currency'] }
  | { type: 'horizon'; horizon: AnalysisInput['horizon'] }
  | { type: 'risk'; riskProfile: AnalysisInput['riskProfile'] }
  | { type: 'next' }
  | { type: 'back' }

export function setupReducer(state: SetupState, action: SetupAction): SetupState {
  if (action.type === 'amount') {
    return { ...state, input: { ...state.input, amount: action.amount, currency: action.currency }, error: null }
  }
  if (action.type === 'horizon') {
    return { ...state, input: { ...state.input, horizon: action.horizon }, error: null }
  }
  if (action.type === 'risk') {
    return { ...state, input: { ...state.input, riskProfile: action.riskProfile }, error: null }
  }
  if (action.type === 'back') {
    const previous: Record<Step, Step> = {
      amount: 'amount',
      horizon: 'amount',
      risk: 'horizon',
      summary: 'risk',
    }
    return { ...state, step: previous[state.step], error: null }
  }

  const amountIsValid = /^(?!0+(?:\.0+)?$)\d+(?:\.\d{1,2})?$/.test(state.input.amount ?? '')
  const valid =
    (state.step === 'amount' && amountIsValid && Boolean(state.input.currency)) ||
    (state.step === 'horizon' && Boolean(state.input.horizon)) ||
    (state.step === 'risk' && Boolean(state.input.riskProfile)) ||
    state.step === 'summary'

  if (!valid) return { ...state, error: 'current-step-invalid' }

  const next: Record<Step, Step> = {
    amount: 'horizon',
    horizon: 'risk',
    risk: 'summary',
    summary: 'summary',
  }
  return { ...state, step: next[state.step], error: null }
}
```

- [ ] **Step 5: Implement the wizard UI**

Implement one focused panel with:

- `1 / 3`, `2 / 3`, `3 / 3` textual progress.
- A labelled amount input using `inputMode="decimal"`, minimum 16 px type, and a separate currency selector.
- Native radio groups for daily/weekly/monthly and low/balanced/high.
- Back and Continue controls; Continue stays present but disabled until the current value is valid.
- A summary step that shows all three choices and submits the parsed `AnalysisInput`.
- Inline errors connected with `aria-describedby`; focus the first invalid field after submission.
- Exact transition properties `opacity, transform`; disable transform under reduced motion.

Add the required Turkish and English keys to `copy.ts`. Render `SetupWizard` inside `AppShell` on `/`.

- [ ] **Step 6: Run tests, then keyboard-check the flow**

```bash
npm run test -- src/features/analysis/setup-reducer.test.ts src/features/analysis/setup-wizard.test.tsx
npm run typecheck
npm run dev -- --hostname 127.0.0.1
```

At `http://127.0.0.1:3000`, use only Tab, Shift+Tab, Space, arrow keys and Enter. Expected: every choice and action is reachable; focus order matches visual order; Back preserves answers.

- [ ] **Step 7: Commit the setup flow**

```bash
git add src/app/page.tsx src/features/analysis/setup-reducer.ts src/features/analysis/setup-reducer.test.ts src/features/analysis/setup-wizard.tsx src/features/analysis/setup-wizard.test.tsx src/lib/copy.ts
git commit -m "feat: add analysis setup flow"
```

## Task 5: Add the Deterministic Fixture Scan and Quality Gate

**Files:**
- Create: `src/features/analysis/analysis-service.ts`
- Create: `src/features/analysis/fixtures.ts`
- Create: `src/features/analysis/fixture-analysis-service.ts`
- Create: `src/features/analysis/fixture-analysis-service.test.ts`
- Create: `src/features/analysis/scan-view.tsx`
- Create: `src/features/analysis/analysis-experience.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/lib/copy.ts`

**Interfaces:**
- Consumes: `AnalysisInput`, `AnalysisResult`, `Opportunity`, `passesQualityGate()`.
- Produces: `AnalysisService.run(input, onStage): Promise<AnalysisResult>`, `fixtureAnalysisService`, and `AnalysisExperience`.

- [ ] **Step 1: Define the service interface**

Create `src/features/analysis/analysis-service.ts`:

```ts
import type { AnalysisInput, AnalysisResult } from './analysis-contract'

export type ScanStage = 'updating' | 'filtering' | 'risk' | 'ranking'
export type StageObserver = (stage: ScanStage) => void

export interface AnalysisService {
  run(input: AnalysisInput, onStage: StageObserver): Promise<AnalysisResult>
}
```

- [ ] **Step 2: Write failing ranking and quality tests**

Create `src/features/analysis/fixture-analysis-service.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { fixtureAnalysisService } from './fixture-analysis-service'

const input = {
  amount: '5000',
  currency: 'USD',
  horizon: 'weekly',
  riskProfile: 'balanced',
} as const

describe('fixtureAnalysisService', () => {
  it('reports real computation stages and returns one plus two results', async () => {
    const stages: string[] = []
    const result = await fixtureAnalysisService.run(input, (stage) => stages.push(stage))

    expect(stages).toEqual(['updating', 'filtering', 'risk', 'ranking'])
    expect(result.alternatives).toHaveLength(2)
    expect(result.primary.totalScore).toBeGreaterThanOrEqual(result.alternatives[0].totalScore)
  })

  it('excludes a stale high-scoring asset before ranking', async () => {
    const result = await fixtureAnalysisService.run(input, () => undefined)
    expect([result.primary, ...result.alternatives].map((item) => item.assetId)).not.toContain('stale-leader')
    expect(result.excludedAssetCount).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Run tests and verify failure**

```bash
npm run test -- src/features/analysis/fixture-analysis-service.test.ts
```

Expected: FAIL because the fixture service does not exist.

- [ ] **Step 4: Create honest deterministic fixtures**

Create at least six assets in `fixtures.ts`, spanning stock, crypto, commodity, forex, and index. Every fixture must include all `Opportunity` fields and 24 chronological series points. Include:

- Three fresh, complete assets that become the visible results for balanced/weekly.
- One stale asset with a raw score above 90 and `assetId: 'stale-leader'` to prove the gate runs before ranking.
- One incomplete asset with completeness `0.90`.
- One high-volatility asset whose risk dimension causes a lower score for low-risk input and a higher score for high-risk input.

Fixture timestamps are fixed ISO strings, not `new Date()`, so tests remain deterministic. Label fixture data as demonstration data in the UI.

- [ ] **Step 5: Implement the scan pipeline**

Implement `fixture-analysis-service.ts` so each observer stage is emitted only after its named synchronous computation completes. Use these exact scoring helpers:

```ts
import type { AnalysisInput, Opportunity, ScoreDimension } from './analysis-contract'

const HORIZON_WEIGHTS: Record<AnalysisInput['horizon'], Record<ScoreDimension, number>> = {
  daily: { trend: 0.15, momentum: 0.30, liquidity: 0.25, risk: 0.20, market: 0.10 },
  weekly: { trend: 0.25, momentum: 0.25, liquidity: 0.20, risk: 0.20, market: 0.10 },
  monthly: { trend: 0.30, momentum: 0.15, liquidity: 0.15, risk: 0.25, market: 0.15 },
}

function scoreForInput(asset: Opportunity, input: AnalysisInput): Opportunity {
  const weights = HORIZON_WEIGHTS[input.horizon]
  const weighted = (Object.keys(weights) as ScoreDimension[]).reduce(
    (sum, dimension) => sum + asset.dimensions[dimension] * weights[dimension],
    0,
  )
  const riskFloor = input.riskProfile === 'low' ? 80 : input.riskProfile === 'balanced' ? 65 : 45
  const riskMultiplier = input.riskProfile === 'low' ? 0.35 : input.riskProfile === 'balanced' ? 0.20 : 0.10
  const penalty = Math.max(0, riskFloor - asset.dimensions.risk) * riskMultiplier
  const totalScore = Math.max(0, Math.min(100, Math.round(weighted - penalty)))
  return { ...asset, totalScore }
}

const updated = fixtureOpportunities.map((asset) => ({ ...asset }))
onStage('updating')

const eligible = updated.filter((asset) => passesQualityGate(asset.quality))
onStage('filtering')

const riskAdjusted = eligible.map((asset) => scoreForInput(asset, input))
onStage('risk')

const ranked = riskAdjusted.toSorted((a, b) => b.totalScore - a.totalScore)
onStage('ranking')
```

Return the first item as `primary`, the next two as the required tuple, and counts from the original and eligible arrays. Throw a typed `InsufficientResultsError` if fewer than three eligible results remain.

- [ ] **Step 6: Implement scan and error UI**

`AnalysisExperience` owns the UI state union:

```ts
type ExperienceState =
  | { status: 'setup' }
  | { status: 'scanning'; stage: ScanStage }
  | { status: 'complete'; result: AnalysisResult }
  | { status: 'error'; message: string }
```

`ScanView` lists the four stages, uses `aria-live="polite"` for stage changes, and never uses percentages or a fake countdown. On error, retain the user's input and offer “Yeniden dene” and “Seçimleri düzenle”.

- [ ] **Step 7: Run service and component tests**

```bash
npm run test -- src/features/analysis/fixture-analysis-service.test.ts src/features/analysis/setup-wizard.test.tsx
npm run typecheck
```

Expected: all tests pass.

- [ ] **Step 8: Commit the fixture pipeline**

```bash
git add src/app/page.tsx src/features/analysis src/lib/copy.ts
git commit -m "feat: add deterministic market scan"
```

## Task 6: Build Results, Opportunity Cards, Chart, and Score Explanation

**Files:**
- Create: `src/features/analysis/results-view.tsx`
- Create: `src/features/analysis/opportunity-card.tsx`
- Create: `src/features/analysis/opportunity-card.test.tsx`
- Create: `src/features/analysis/price-line-chart.tsx`
- Create: `src/features/analysis/price-line-chart.test.tsx`
- Create: `src/features/analysis/score-breakdown.tsx`
- Create: `src/app/analysis/page.tsx`
- Create: `src/app/methodology/page.tsx`
- Modify: `src/features/analysis/analysis-experience.tsx`
- Modify: `src/lib/copy.ts`

**Interfaces:**
- Consumes: `AnalysisResult`, `Opportunity`, formatter functions, design tokens.
- Produces: `ResultsView`, `OpportunityCard`, `PriceLineChart`, and `ScoreBreakdown`.

- [ ] **Step 1: Write the failing primary-card test**

Create `src/features/analysis/opportunity-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { fixtureOpportunities } from './fixtures'
import { OpportunityCard } from './opportunity-card'

describe('OpportunityCard', () => {
  it('shows score evidence, risk and data status without trade language', () => {
    render(<OpportunityCard opportunity={fixtureOpportunities[0]} locale="tr-TR" emphasis="primary" />)

    expect(screen.getByText(/Phanfora Skoru/)).toBeInTheDocument()
    expect(screen.getByText(fixtureOpportunities[0].primaryRisk)).toBeInTheDocument()
    expect(screen.getByText(/Demo verisi/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /al|sat/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test and verify failure**

```bash
npm run test -- src/features/analysis/opportunity-card.test.tsx
```

Expected: FAIL because `OpportunityCard` does not exist.

- [ ] **Step 3: Implement the accessible SVG line chart**

`PriceLineChart` must:

- Accept `series`, `symbol`, and `locale` props.
- Calculate SVG points from the finite min/max range and handle a flat series without division by zero.
- Render `role="img"` with an accessible label containing symbol, start price, end price, minimum, and maximum.
- Use a single accent stroke, no gradient fill, no pulse, and no sweep animation.
- Provide the first and last values as visible text outside the SVG at narrow widths.

Create `src/features/analysis/price-line-chart.test.tsx` before implementing the component:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PriceLineChart } from './price-line-chart'

describe('PriceLineChart', () => {
  it('describes and renders a flat series without invalid SVG points', () => {
    const { container } = render(
      <PriceLineChart
        symbol="FLAT"
        locale="en-US"
        series={[{ time: '2026-09-23', value: 10 }, { time: '2026-09-24', value: 10 }]}
      />,
    )
    expect(screen.getByRole('img', { name: /FLAT.*minimum 10.*maximum 10/i })).toBeInTheDocument()
    expect(container.querySelector('polyline')?.getAttribute('points')).not.toMatch(/NaN|Infinity/)
  })

  it('includes start, end, minimum and maximum in the accessible name', () => {
    render(
      <PriceLineChart
        symbol="RISE"
        locale="en-US"
        series={[{ time: '2026-09-23', value: 10 }, { time: '2026-09-24', value: 14 }]}
      />,
    )
    expect(screen.getByRole('img', { name: /RISE.*start 10.*end 14.*minimum 10.*maximum 14/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Implement the opportunity hierarchy**

The primary card contains, in order:

1. Asset identity and category.
2. Current price and signed change.
3. `Phanfora Skoru: NN / 100` and confidence label.
4. Chart.
5. Up to three reasons.
6. A visually distinct but non-alarming primary risk.
7. Data time and “Demo verisi” disclosure.
8. “Analizi incele” and “İzlemeye ekle” controls; watchlist is disabled with an accessible “Hesap özelliği sonraki ürün fazında” description in Phase 1.

Alternatives use the same semantic order with reduced visual emphasis. Do not hide risk to save space.

- [ ] **Step 5: Implement the score breakdown**

Render all five dimensions as labelled numeric rows. A bar may supplement the number but cannot replace it. The disclosure title is “Skor nasıl hesaplandı?” and includes:

- Dimension name and score.
- Weekly fixture weight.
- Weighted contribution.
- Methodology version.
- Observed-at timestamp.
- A link to `/methodology`.

Use a native `<details>` element for progressive disclosure in Phase 1, with a visible focus treatment and a chevron that rotates only when motion is allowed.

- [ ] **Step 6: Build the result layout and methodology page**

`ResultsView` uses one wide primary column and one narrower alternatives column above the content-defined collapse point. On mobile, primary precedes alternatives in DOM and visual order. The methodology page explains the five dimensions, weekly weights, quality gate, confidence distinction, and fixture limitation in concise Turkish and English copy.

- [ ] **Step 7: Run focused tests and build**

```bash
npm run test -- src/features/analysis/opportunity-card.test.tsx src/features/analysis/price-line-chart.test.tsx
npm run typecheck
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 8: Commit the result experience**

```bash
git add src/app/analysis src/app/methodology src/features/analysis src/lib/copy.ts
git commit -m "feat: add explainable opportunity results"
```

## Task 7: Complete Responsive, Localization, and End-to-End Verification

**Files:**
- Create: `e2e/setup-to-result.spec.ts`
- Create: `e2e/accessibility-layout.spec.ts`
- Modify: `src/app/globals.css`
- Modify: `src/lib/copy.ts`
- Modify: `src/features/analysis/setup-wizard.tsx`
- Modify: `src/features/analysis/results-view.tsx`
- Modify: `src/features/analysis/opportunity-card.tsx`
- Modify: `src/components/app-shell.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: complete Phase 1 vertical slice.
- Produces: browser-verified Turkish and English flows at desktop and mobile sizes, plus contributor instructions.

- [ ] **Step 1: Write the full-flow browser test**

Create `e2e/setup-to-result.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('completes setup and explains the primary result', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Değerlendirilecek tutar').fill('5000')
  await page.getByRole('button', { name: 'Devam et' }).click()
  await page.getByRole('radio', { name: 'Haftalık' }).check()
  await page.getByRole('button', { name: 'Devam et' }).click()
  await page.getByRole('radio', { name: 'Dengeli' }).check()
  await page.getByRole('button', { name: 'Piyasaları tara' }).click()

  await expect(page.getByRole('heading', { name: /öne çıkan fırsat/i })).toBeVisible()
  await expect(page.getByText(/Phanfora Skoru/).first()).toBeVisible()
  await page.getByText('Skor nasıl hesaplandı?').first().click()
  await expect(page.getByText('Trend').first()).toBeVisible()
  await expect(page.getByText('Demo verisi').first()).toBeVisible()
})
```

- [ ] **Step 2: Write layout, zoom, keyboard, and reduced-motion tests**

Create `e2e/accessibility-layout.spec.ts` with four tests:

```ts
import { expect, test } from '@playwright/test'

test('keeps the primary action visible at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Devam et' })).toBeVisible()
  expect(await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true)
})

test('supports 200 percent zoom without horizontal clipping', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => { document.documentElement.style.zoom = '2' })
  expect(await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true)
})

test('completes the flow with keyboard controls', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await page.getByLabel('Değerlendirilecek tutar').focus()
  await page.keyboard.type('5000')
  await page.getByRole('button', { name: 'Devam et' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('radio', { name: 'Haftalık' }).focus()
  await page.keyboard.press('Space')
  await page.getByRole('button', { name: 'Devam et' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('radio', { name: 'Dengeli' }).focus()
  await page.keyboard.press('Space')
  await page.getByRole('button', { name: 'Piyasaları tara' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText(/Phanfora Skoru/).first()).toBeVisible()
})

test.use({ reducedMotion: 'reduce' })
test('removes nonessential transform motion', async ({ page }) => {
  await page.goto('/')
  const duration = await page.locator('[data-step-panel]').evaluate((node) => getComputedStyle(node).transitionDuration)
  expect(duration).toMatch(/0\.01ms|0s/)
})
```

- [ ] **Step 3: Run the browser tests and record each failure**

```bash
npm run test:e2e
```

Expected before fixes: at least one failure is likely at 320 px, 200% zoom, or focus order. Treat each observed failure as evidence; do not loosen assertions to make it pass.

- [ ] **Step 4: Fix responsive and localization defects**

Apply these layout rules while fixing observed failures:

- Use logical properties (`padding-inline`, `margin-inline`) for direction-sensitive spacing.
- Use `min-width: 0` on grid and flex children that contain prices or long labels.
- Allow translated control labels to wrap; do not set fixed heights on text containers.
- Keep 12 px between adjacent bordered controls and at least 24 px around borderless icon actions.
- Collapse the results grid only when the primary column falls below its readable width; do not choose a breakpoint solely because it is a common device width.
- Keep content at the viewport edge only for the chart; keep controls inside 16–20 px mobile margins.
- Ensure English copy is selectable through a deterministic locale control and persists for the session.

- [ ] **Step 5: Document local development and fixture limitations**

Update `README.md` with:

- Node 22 requirement and `nvm use`.
- `npm install`, `npm run dev`, `npm run check`, and `npm run test:e2e` commands.
- Phase 1 routes.
- A prominent statement that all market results are deterministic demonstration fixtures and must not be presented as live data.
- The five-plan decomposition and the next plan name: Market Data.
- Environment policy: `.env*` is ignored except `.env.example`; no secret may use a `NEXT_PUBLIC_` prefix unless it is intentionally public.

- [ ] **Step 6: Run the complete verification suite**

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Expected: all commands exit `0`, unit test output reports zero failures, both Playwright projects pass, and the production build completes.

- [ ] **Step 7: Inspect the diff for accidental scope**

```bash
git status --short
git diff --check
git diff --stat
```

Expected: only Phase 1 application, tests, docs, and generated dependency lock changes are present; `git diff --check` prints nothing.

- [ ] **Step 8: Commit Phase 1 verification**

```bash
git add README.md e2e src/app/globals.css src/lib/copy.ts src/components src/features
git commit -m "test: verify Phanfora foundation flow"
```

## Completion Evidence

Before claiming this plan complete, capture and report:

```bash
git log --oneline --max-count=7
npm run check
npm run test:e2e
git status --short
```

The completion report must state the exact passing test counts, build result, any intentionally untracked files, and the commit range produced by this plan.

## Authoritative Setup References

- Next.js App Router and project structure: <https://nextjs.org/docs/app>
- Next.js installation and supported runtime: <https://nextjs.org/docs/app/getting-started/installation>
- Next.js Vitest guide: <https://nextjs.org/docs/app/guides/testing/vitest>
- Tailwind CSS with Next.js: <https://tailwindcss.com/docs/installation/framework-guides/nextjs>
- Playwright installation: <https://playwright.dev/docs/intro>

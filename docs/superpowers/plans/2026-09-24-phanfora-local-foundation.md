# Phanfora Local Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-minded local Phanfora application that completes the guided analysis journey with deterministic, clearly labeled fixture market and FX data.

**Architecture:** A pnpm TypeScript monorepo separates the Next.js web application, Fastify API, worker entrypoint, and framework-independent domain packages. The first local slice executes analysis through shared deterministic services while preserving provider, persistence, and queue interfaces for later PostgreSQL, Redis, and licensed market-data integrations.

**Tech Stack:** Node.js 24 LTS, pnpm workspaces, TypeScript strict mode, Next.js App Router, React, Fastify, TypeBox, decimal.js, Vitest, Testing Library, Playwright, CSS Modules/global CSS.

**Spec:** `docs/superpowers/specs/2026-09-24-phanfora-production-foundation-design.md`

## Global Constraints

- Fixture market and FX data must always render `Demo veri`; it must never be described as live.
- Authoritative money and rates cross package boundaries as decimal strings plus ISO 4217 currency codes.
- A score must not be returned when its data-quality gate fails.
- Every result includes `methodologyVersion`, `dataSnapshotId`, `calculatedAt`, and `dataMode`.
- Provider credentials remain server-side and no secret value is committed.
- The critical amount → horizon → risk → scan → results flow is keyboard-complete and responsive.
- Turkish is the initial locale; the message structure supports English without embedding copy in domain packages.
- Production code follows test-first red/green/refactor cycles; configuration-only files do not carry behavioral tests.

---

## File Map

```text
package.json                         workspace commands
pnpm-workspace.yaml                 workspace package discovery
tsconfig.base.json                  strict shared TypeScript defaults
.gitignore                          generated files and secrets
.env.example                        non-secret environment names
README.md                           local setup and data-mode explanation

apps/api/src/app.ts                 Fastify construction and routes
apps/api/src/server.ts              API process entrypoint
apps/api/src/app.test.ts            route contract integration tests
apps/worker/src/index.ts            worker health/fixture execution entrypoint

apps/web/src/app/layout.tsx         document shell and metadata
apps/web/src/app/page.tsx           Today journey
apps/web/src/app/explore/page.tsx   Explore fixture catalog
apps/web/src/app/watchlist/page.tsx watchlist empty state
apps/web/src/app/history/page.tsx   local analysis history state
apps/web/src/app/globals.css        tokens, layout, responsive styling
apps/web/src/components/*           focused UI components
apps/web/src/lib/api.ts             typed API client with local fallback URL
apps/web/src/lib/messages.ts        Turkish/English copy dictionaries
apps/web/src/**/*.test.tsx          component behavior tests

packages/domain/src/index.ts        canonical asset, money, request, result types
packages/contracts/src/index.ts     TypeBox API schemas and inferred types
packages/currency/src/index.ts      catalog, parsing, formatting, conversion
packages/currency/src/index.test.ts currency behavior tests
packages/market-data/src/index.ts   provider contracts and fixture provider
packages/market-data/src/index.test.ts provider normalization tests
packages/scoring/src/index.ts       deterministic score and quality gates
packages/scoring/src/index.test.ts  score behavior tests
packages/analysis/src/index.ts      scan orchestration service
packages/analysis/src/index.test.ts end-to-end domain flow tests

playwright.config.ts                browser projects and web server
e2e/analysis-flow.spec.ts           critical browser journey
```

---

### Task 1: Workspace and currency domain

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/domain/src/index.ts`
- Create: `packages/currency/package.json`
- Create: `packages/currency/tsconfig.json`
- Create: `packages/currency/src/index.test.ts`
- Create: `packages/currency/src/index.ts`

**Interfaces:**
- Produces: `Money`, `CurrencyCode`, `AnalysisInput`, `CanonicalAsset`, `DataMode`, `Freshness`, `ScoreResult`, `CurrencyDefinition`, `FxRateSnapshot`.
- Produces: `parseMoneyInput(value, currency)`, `convertMoney(money, target, snapshot)`, `formatMoney(money, locale)`, `searchCurrencies(query)`.

- [ ] **Step 1: Create workspace-only configuration**

Use pnpm workspaces, shared strict TypeScript settings, Node 24 engine declaration, and scripts for `dev`, `build`, `typecheck`, `lint`, and `test`. Ignore `.env*` except `.env.example`, `.next`, `dist`, `coverage`, `node_modules`, Playwright artifacts, and local data.

- [ ] **Step 2: Write failing currency tests**

Cover these hand-derived behaviors:

```ts
expect(parseMoneyInput('12.345,67', 'TRY', 'tr-TR')).toEqual({ amount: '12345.67', currency: 'TRY' });
expect(convertMoney({ amount: '100.00', currency: 'USD' }, 'TRY', usdSnapshot)).toEqual({ amount: '4250', currency: 'TRY' });
expect(convertMoney({ amount: '100', currency: 'EUR' }, 'TRY', usdSnapshot)).toEqual({ amount: '5000', currency: 'TRY' });
expect(() => convertMoney({ amount: '100', currency: 'USD' }, 'ZZZ', usdSnapshot)).toThrow('FX_RATE_UNAVAILABLE');
expect(searchCurrencies('türk').map((item) => item.code)).toContain('TRY');
```

- [ ] **Step 3: Run the currency test and verify RED**

Run: `pnpm --filter @phanfora/currency test`

Expected: failure because the currency module exports do not yet exist.

- [ ] **Step 4: Implement domain types and minimal currency behavior**

Use `decimal.js` for conversion. Include a useful ISO 4217 catalog covering globally traded and regional currencies, with Turkish and English names. Parsing accepts Turkish and English grouping/decimal conventions but rejects negative, zero, malformed, and exponent-form inputs.

- [ ] **Step 5: Run verification and commit**

Run: `pnpm --filter @phanfora/currency test && pnpm typecheck`

Expected: all currency tests and strict type checking pass.

Commit: `feat: establish domain and currency foundation`

---

### Task 2: Market fixtures and deterministic scoring

**Files:**
- Create: `packages/market-data/package.json`
- Create: `packages/market-data/tsconfig.json`
- Create: `packages/market-data/src/index.test.ts`
- Create: `packages/market-data/src/index.ts`
- Create: `packages/scoring/package.json`
- Create: `packages/scoring/tsconfig.json`
- Create: `packages/scoring/src/index.test.ts`
- Create: `packages/scoring/src/index.ts`

**Interfaces:**
- Consumes: domain money, asset, freshness, and score types.
- Produces: `MarketDataProvider`, `FxRateProvider`, `FixtureMarketDataProvider`, `FixtureFxRateProvider`.
- Produces: `calculateScore(candidate, input): ScoreResult | QualityGateFailure`.

- [ ] **Step 1: Write failing provider tests**

Assert the real fixture provider returns all five asset classes, stable canonical IDs, immutable snapshot IDs, `dataMode: 'fixture'`, and explicit observed/freshness metadata. Assert unknown assets return a typed not-found failure.

- [ ] **Step 2: Run provider tests and verify RED**

Run: `pnpm --filter @phanfora/market-data test`

Expected: failure because providers are not implemented.

- [ ] **Step 3: Implement provider contracts and fixtures**

Create representative BTC, AAPL, gold, EUR/USD, and S&P 500 fixtures. Include score-input dimensions, quote currency, price series, market status, source label, observed time, and quality metadata. Freeze returned snapshots to prevent cross-analysis mutation.

- [ ] **Step 4: Write failing scoring tests**

Test literal totals for daily/weekly/monthly weights, low-risk volatility penalties, stable high-risk behavior, confidence independent of score, and rejection of stale, incomplete, or low-liquidity data.

- [ ] **Step 5: Run scoring tests and verify RED**

Run: `pnpm --filter @phanfora/scoring test`

Expected: failure because scoring behavior is absent.

- [ ] **Step 6: Implement scoring v1**

Calculate the five dimension contributions using the approved horizon weights. Apply risk and liquidity penalties after the weighted base. Clamp valid results to 0–100. Derive structured explanation keys and one primary-risk key from the strongest evidence. Emit methodology `phanfora-v1`.

- [ ] **Step 7: Run verification and commit**

Run: `pnpm --filter @phanfora/market-data test && pnpm --filter @phanfora/scoring test && pnpm typecheck`

Expected: provider/scoring tests and type checking pass.

Commit: `feat: add fixture providers and scoring engine`

---

### Task 3: Analysis orchestration and API contracts

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/analysis/package.json`
- Create: `packages/analysis/tsconfig.json`
- Create: `packages/analysis/src/index.test.ts`
- Create: `packages/analysis/src/index.ts`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/app.test.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`

**Interfaces:**
- Produces: `CreateAnalysisBodySchema`, `AnalysisResponseSchema`, `ApiErrorSchema`.
- Produces: `AnalysisService.create(input, idempotencyKey): Promise<AnalysisResult>`.
- Produces endpoints: `GET /health`, `GET /v1/currencies`, `GET /v1/assets`, `POST /v1/analyses`.

- [ ] **Step 1: Define versioned schemas**

Use TypeBox to describe request and response boundaries. Amount is a positive decimal string; currency is a three-letter code; horizon and risk are closed enums. Responses include primary, alternatives, exclusions, snapshot metadata, and data mode.

- [ ] **Step 2: Write failing analysis service tests**

Verify the same input and idempotency key returns the same request ID and result, one primary plus two alternatives are sorted descending, currency conversion uses one FX snapshot, and excluded assets carry structured quality reasons.

- [ ] **Step 3: Run analysis tests and verify RED**

Run: `pnpm --filter @phanfora/analysis test`

Expected: failure because the service is not implemented.

- [ ] **Step 4: Implement the analysis service**

Inject market, FX, clock, and ID dependencies. Keep the in-memory idempotency store inside the fixture composition root, not the domain service. Return immutable result objects.

- [ ] **Step 5: Write failing API integration tests**

Use Fastify injection against the real app. Assert health response, currency catalog, valid analysis `201`, repeated idempotency request `200` with the same ID, invalid amount `400`, unsupported content type `415`, and missing idempotency key `400`.

- [ ] **Step 6: Run API tests and verify RED**

Run: `pnpm --filter @phanfora/api test`

Expected: route tests fail because the app is not implemented.

- [ ] **Step 7: Implement Fastify application**

Register security headers, CORS restricted to configured origins, request-size limits, structured redacted logging, schema validation, and consistent error envelopes. Build the app separately from process startup so integration tests do not open ports.

- [ ] **Step 8: Run verification and commit**

Run: `pnpm --filter @phanfora/analysis test && pnpm --filter @phanfora/api test && pnpm typecheck`

Expected: analysis/API tests and type checking pass.

Commit: `feat: expose validated analysis api`

---

### Task 4: Worker boundary and local composition

**Files:**
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/src/index.test.ts`
- Create: `apps/worker/src/index.ts`

**Interfaces:**
- Consumes: `AnalysisService` and versioned analysis input.
- Produces: `processAnalysisJob(job): Promise<AnalysisResult>` and a process health response.

- [ ] **Step 1: Write a failing worker contract test**

Assert a valid serialized job produces the same methodology, snapshot, and ranking as direct analysis, while malformed jobs fail before provider access.

- [ ] **Step 2: Run worker tests and verify RED**

Run: `pnpm --filter @phanfora/worker test`

Expected: failure because the job processor is absent.

- [ ] **Step 3: Implement the worker boundary**

Validate serialized jobs with the shared contract, execute the injected analysis service, and expose a simple local CLI smoke command. Do not introduce Redis until persistence-backed asynchronous processing is scheduled.

- [ ] **Step 4: Run verification and commit**

Run: `pnpm --filter @phanfora/worker test && pnpm typecheck`

Expected: worker tests and type checking pass.

Commit: `feat: add analysis worker boundary`

---

### Task 5: Web shell and guided analysis form

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/components/app-shell.tsx`
- Create: `apps/web/src/components/analysis-wizard.tsx`
- Create: `apps/web/src/components/currency-combobox.tsx`
- Create: `apps/web/src/components/analysis-wizard.test.tsx`
- Create: `apps/web/src/lib/messages.ts`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`

**Interfaces:**
- Consumes: API contract types and currency catalog.
- Produces: accessible three-step wizard and submitted analysis state.

- [ ] **Step 1: Load the selected UI craft guidance**

Use the UI Skills router to select no more than three focused skills for layout, typography, and accessibility. Apply the approved Phanfora tokens and avoid introducing an unrelated component library.

- [ ] **Step 2: Write failing wizard tests**

Render the real component and verify: amount is required on continue, Turkish-formatted input is normalized, currency search selects TRY/USD/EUR, back navigation preserves state, risk selection is keyboard operable, and submit calls the API client with the exact normalized request.

- [ ] **Step 3: Run web component tests and verify RED**

Run: `pnpm --filter @phanfora/web test -- analysis-wizard`

Expected: failure because components do not exist.

- [ ] **Step 4: Implement the shell and wizard**

Build a 72 px desktop rail, mobile bottom navigation, quiet top context bar, and focused wizard surface. Use semantic form controls, explicit labels, error summaries, visible focus, 44 px targets, 16 px mobile inputs, logical CSS properties, reduced-motion styles, and local Manrope fallback strategy without a runtime font network request.

- [ ] **Step 5: Run verification and commit**

Run: `pnpm --filter @phanfora/web test && pnpm --filter @phanfora/web typecheck`

Expected: component tests and web type checking pass.

Commit: `feat: build guided analysis experience`

---

### Task 6: Scan, results, asset detail, and navigation states

**Files:**
- Create: `apps/web/src/components/scan-progress.tsx`
- Create: `apps/web/src/components/analysis-results.tsx`
- Create: `apps/web/src/components/asset-card.tsx`
- Create: `apps/web/src/components/score-breakdown.tsx`
- Create: `apps/web/src/components/price-chart.tsx`
- Create: `apps/web/src/components/analysis-results.test.tsx`
- Create: `apps/web/src/app/explore/page.tsx`
- Create: `apps/web/src/app/watchlist/page.tsx`
- Create: `apps/web/src/app/history/page.tsx`

**Interfaces:**
- Consumes: `AnalysisResponse` and API client.
- Produces: scan status, primary/alternative ranking, score disclosure, asset detail expansion, and secondary navigation pages.

- [ ] **Step 1: Write failing result tests**

Assert primary and alternative order, all five dimensions, confidence distinct from score, maximum three reasons, primary risk, methodology, observed time, market state, currency conversion, visible `Demo veri` badge, textual chart summary, and no `Al`/`Sat` action labels.

- [ ] **Step 2: Run result tests and verify RED**

Run: `pnpm --filter @phanfora/web test -- analysis-results`

Expected: failure because result components are absent.

- [ ] **Step 3: Implement scan and result surfaces**

Use four honest status stages without percentages or fabricated duration. Render an SVG price line from fixture series with support/resistance labels and a textual summary. Use number-first score display rather than a red/green gauge. Add disclosure panels for score methodology and data metadata.

- [ ] **Step 4: Implement secondary routes**

Explore lists the five fixture asset classes with filters. Watchlist and History show polished empty states and explain that account persistence is not yet enabled. Navigation remains fully functional on desktop and mobile.

- [ ] **Step 5: Run verification and commit**

Run: `pnpm --filter @phanfora/web test && pnpm --filter @phanfora/web typecheck && pnpm --filter @phanfora/web build`

Expected: tests, type checking, and production build pass.

Commit: `feat: present explainable analysis results`

---

### Task 7: Browser coverage, documentation, and local launch

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/analysis-flow.spec.ts`
- Create: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: workspace dev commands and visible accessible UI roles.
- Produces: reproducible local startup and cross-browser critical-flow verification.

- [ ] **Step 1: Write the failing browser test**

The browser test enters `25.000`, selects TRY, weekly horizon, balanced risk, starts the scan, reaches results, verifies the demo-data disclosure, opens score methodology, and confirms the primary result has five dimension rows and a visible risk statement.

- [ ] **Step 2: Run Playwright and verify RED**

Run: `pnpm test:e2e --project=chromium`

Expected: failure until the dev-server composition and stable roles are wired.

- [ ] **Step 3: Wire local development composition**

Make `pnpm dev` run API and web together with graceful process shutdown. Configure the web application to use `http://127.0.0.1:4000` by default and allow override through `NEXT_PUBLIC_API_URL`. Keep the worker smoke command separate.

- [ ] **Step 4: Write local documentation**

Document Node/pnpm requirements, install, dev, test, build, application/API URLs, fixture-data limitations, environment variables, repository structure, and the future licensed-provider path. State explicitly that the local release is decision-support software and not a trading system.

- [ ] **Step 5: Run full verification**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e --project=chromium
```

Expected: every command exits 0 with no unhandled warnings or failed tests.

- [ ] **Step 6: Start the local application**

Run: `pnpm dev`

Expected: web is available at `http://localhost:3000`, API health at `http://127.0.0.1:4000/health`, and the command remains running for user inspection.

- [ ] **Step 7: Commit**

Commit: `test: verify local phanfora journey`


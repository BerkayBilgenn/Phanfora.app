# Phanfora Live Market Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixture-backed junior wizard with a compact professional analysis surface powered by quota-aware Twelve Data market and FX data.

**Architecture:** A Twelve Data adapter implements the existing market and FX provider boundaries and is injected into the API app. The adapter batches a six-symbol universe, derives deterministic signals from returned series, caches requests for 60 seconds, and fails closed without fixture fallback. The web app uses one persistent analysis form and renders natural quote prices before localized conversions.

**Tech Stack:** TypeScript 5.9, Node.js 24, Fastify 5, Next.js 16, React 19, Vitest, Testing Library, Playwright, Twelve Data REST API.

**Spec:** `docs/superpowers/specs/2026-09-24-phanfora-live-market-redesign.md`

## Global Constraints

- `TWELVE_DATA_API_KEY` is server-only and must never be logged, committed, or exposed to the browser.
- Production requests never fall back to fixture data.
- The free live universe is exactly `BTC/USD,ETH/USD,AAPL,MSFT,EUR/USD,XAU/USD` until provider access changes.
- Natural market price is primary; user-currency conversion is secondary.
- Every external-data failure is explicit and typed.

## Review Focus

- A partial batch response must omit failed symbols without inventing values and reject analyses with fewer than three qualified assets.
- Reversed Twelve Data value ordering must be normalized chronologically before indicators and charts are calculated.
- An unsupported user currency must produce a typed error rather than a deterministic fallback rate.
- Repeated analysis requests inside 60 seconds must reuse provider data without returning stale results indefinitely.
- A supplied API key must remain absent from logs, response bodies, browser code, and git-tracked files.

---

### Task 1: Live provider contract and Twelve Data adapter

**Files:**
- Create: `packages/market-data/src/twelve-data.ts`
- Create: `packages/market-data/src/twelve-data.test.ts`
- Modify: `packages/market-data/src/index.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**
- Consumes: `MarketDataProvider`, `FxRateProvider`, `MarketCandidate`, `FxRateSnapshot`.
- Produces: `TwelveDataProvider`, `MarketDataError`, and `createTwelveDataProvider({ apiKey, fetch, clock, ttlMs })`.

- [ ] **Step 1: Write failing adapter tests**

Test complete Twelve Data batch payloads, reversed series order, partial symbol failures, `USD/USD`, unsupported FX, cache reuse, and provider error sanitization. Use literal JSON fixtures matching Twelve Data's documented response schema.

- [ ] **Step 2: Verify RED**

Run: `pnpm --filter @phanfora/market-data test -- twelve-data.test.ts`  
Expected: FAIL because `TwelveDataProvider` does not exist.

- [ ] **Step 3: Implement the adapter**

Implement URL construction with `URL`/`URLSearchParams`, one batch `/time_series` request, one `/exchange_rate` request when the user currency is not USD, series normalization, signal derivation, freshness classification, immutable outputs, request coalescing, and a 60-second successful-response cache.

- [ ] **Step 4: Verify GREEN**

Run: `pnpm --filter @phanfora/market-data test -- twelve-data.test.ts`  
Expected: all adapter tests PASS.

- [ ] **Step 5: Commit**

Commit: `feat: add quota-aware live market provider`

### Task 2: API live-provider wiring and typed failures

**Files:**
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/server.ts`
- Modify: `apps/api/src/app.test.ts`
- Modify: `packages/analysis/src/index.ts`
- Modify: `packages/analysis/src/index.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `TwelveDataProvider`, provider-specific typed errors, existing `AnalysisService`.
- Produces: `buildApp({ marketData, fxRates })` dependency injection, truthful health/data mode responses, sanitized 502/503 errors.

- [ ] **Step 1: Write failing API and analysis tests**

Assert injected live providers drive health, assets, currencies, and analyses; result data mode is derived from accepted candidates; missing configuration returns `MARKET_DATA_NOT_CONFIGURED`; provider rate limits and outages map to sanitized typed responses; no fixture fallback occurs.

- [ ] **Step 2: Verify RED**

Run: `pnpm --filter @phanfora/api test && pnpm --filter @phanfora/analysis test`  
Expected: FAIL on missing provider injection and hard-coded `fixture` result mode.

- [ ] **Step 3: Implement API wiring**

Read `TWELVE_DATA_API_KEY` only in `server.ts`, create a single provider instance, inject it into `buildApp`, derive result mode/freshness from provider data, redact sensitive configuration, and map typed provider errors without exposing upstream text.

- [ ] **Step 4: Verify GREEN**

Run: `pnpm --filter @phanfora/api test && pnpm --filter @phanfora/analysis test`  
Expected: all API and analysis tests PASS.

- [ ] **Step 5: Commit**

Commit: `feat: serve live analyses without fixture fallback`

### Task 3: Compact professional analysis controls

**Files:**
- Replace: `apps/web/src/components/analysis-wizard.tsx`
- Replace: `apps/web/src/components/analysis-wizard.test.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: currency catalog and `onSubmit(AnalysisInput)`.
- Produces: one always-visible `AnalysisPanel` form with amount, currency, horizon, risk, coverage, and one submit action.

- [ ] **Step 1: Write failing interaction tests**

Assert every control is visible simultaneously, a single submit creates the normalized input, invalid amount focuses the amount field, values remain editable, and the old `1 / 3`, `Devam et`, and question headings are absent.

- [ ] **Step 2: Verify RED**

Run: `pnpm --filter @phanfora/web test -- analysis-wizard.test.tsx`  
Expected: FAIL because the current component is a three-step wizard.

- [ ] **Step 3: Implement the compact form**

Build a semantic form/fieldset layout, keep the searchable currency control, use segmented horizon/risk controls, show honest six-instrument/four-class coverage, and preserve keyboard/focus behavior. Reuse the existing CSS token system and let controls wrap at content-driven breakpoints.

- [ ] **Step 4: Verify GREEN**

Run: `pnpm --filter @phanfora/web test -- analysis-wizard.test.tsx`  
Expected: all form tests PASS.

- [ ] **Step 5: Commit**

Commit: `feat: replace onboarding wizard with analysis panel`

### Task 4: Natural-price-first live results

**Files:**
- Modify: `apps/web/src/components/analysis-results.tsx`
- Modify: `apps/web/src/components/analysis-results.test.tsx`
- Modify: `apps/web/src/components/asset-card.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: `AnalysisResult` containing natural and converted prices plus freshness metadata.
- Produces: results where `price` is primary, `convertedPrice` is secondary, and live/delayed/EOD state is visible.

- [ ] **Step 1: Write failing rendering tests**

Assert BTC's USD price is the main price, TRY is a secondary equivalent, `Demo veri` is absent for live results, provider/source and observation time are visible, and delayed/EOD labels are rendered from data rather than hard-coded.

- [ ] **Step 2: Verify RED**

Run: `pnpm --filter @phanfora/web test -- analysis-results.test.tsx`  
Expected: FAIL because converted TRY is currently primary and fixture labels are hard-coded.

- [ ] **Step 3: Implement the result hierarchy**

Render natural quote prices first, local equivalents second, dynamic freshness/status labels, honest coverage counts, and compact alternative rows. Keep risk reasons, score disclosure, and accessible chart descriptions.

- [ ] **Step 4: Verify GREEN**

Run: `pnpm --filter @phanfora/web test -- analysis-results.test.tsx`  
Expected: all result tests PASS.

- [ ] **Step 5: Commit**

Commit: `feat: present live prices in natural quote currency`

### Task 5: End-to-end live-local verification

**Files:**
- Modify: `e2e/analysis-flow.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: complete API and web behavior.
- Produces: documented local startup and browser proof of the new flow.

- [ ] **Step 1: Update the E2E behavior test**

Assert the compact form is immediately usable, a scan completes, BTC-style USD natural pricing is not replaced by the input currency, and no demo badge appears. The E2E environment must use controlled recorded HTTP payloads, not spend external API quota.

- [ ] **Step 2: Run repository verification**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm test:e2e`  
Expected: all commands exit 0.

- [ ] **Step 3: Run a live smoke test**

Start API/web with the user-supplied key injected only into the process environment, submit one local analysis, verify a non-fixture result and current observation metadata, then inspect the browser at desktop and mobile widths.

- [ ] **Step 4: Secret scan**

Run: `git diff --check && git grep -n 'TWELVE_DATA_API_KEY=' -- ':!*.example'`  
Expected: clean diff; no tracked secret assignment.

- [ ] **Step 5: Commit**

Commit: `test: verify live local analysis experience`


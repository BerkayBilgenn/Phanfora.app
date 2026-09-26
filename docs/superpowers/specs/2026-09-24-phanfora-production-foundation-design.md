# Phanfora Production Foundation Design

**Status:** Approved foundation direction  
**Date:** 24 September 2026  
**Repository:** `BerkayBilgenn/Phanfora.app`  
**Application domain:** `app.phanfora.com`

## 1. Purpose

This document turns the approved Phanfora product design into a production-minded technical foundation. The first release must run locally and provide the complete amount → horizon → risk → scan → results experience without presenting fixture data as live market data. The architecture must allow real market, foreign-exchange, identity, queue, and persistence providers to be added without rewriting the product.

This document supplements the existing Phanfora product design. If the two conflict, the safety, data-quality, and non-advisory rules in the product design take precedence.

## 2. Delivery boundary

The first implementation includes:

- A responsive Turkish-first application shell with English-ready localization.
- Amount and ISO 4217 currency selection, daily/weekly/monthly horizon selection, and low/balanced/high risk selection.
- A transparent scan state followed by one primary opportunity and two alternatives.
- Asset detail, score breakdown, confidence, reasons, primary risk, source, freshness, and market status.
- Stocks, cryptoassets, commodities, foreign exchange, and indexes represented through one canonical asset model.
- Searchable world-currency selection and deterministic currency conversion.
- A clearly labeled fixture provider for local development.
- Provider interfaces for future licensed market and FX data.
- Automated unit, component, integration, and browser tests for the critical flow.
- A local development setup and documented environment configuration.

The first implementation does not include live trading, custody, payments, personalized legal or tax advice, production user accounts, or claims of universal real-time coverage.

## 3. Architecture choice

Phanfora uses a modular TypeScript monorepo. It begins as three deployable applications rather than premature microservices:

```text
apps/web       Next.js user interface and server-rendered application shell
apps/api       Fastify HTTP API and input/output validation boundary
apps/worker    Background scan and score job processor
packages/domain        Canonical business types and invariants
packages/contracts     Versioned request, event, and response schemas
packages/currency      Currency catalog, precision, and conversion rules
packages/market-data   Provider interfaces, fixtures, and normalization
packages/scoring       Deterministic score engine and quality gates
packages/ui            Accessible shared components and design tokens
packages/config        Shared TypeScript, lint, and test configuration
```

`pnpm` workspaces manage dependencies and task execution. Applications consume packages only through their public exports. Domain packages never import framework or infrastructure code.

## 4. Runtime choices

- Node.js 24 LTS is the runtime baseline.
- TypeScript runs in strict mode with unchecked indexed access enabled.
- Next.js App Router renders the web application.
- Fastify exposes schema-validated API endpoints.
- PostgreSQL is the production system of record for users, requests, results, snapshots, methodology versions, and watchlists.
- Redis backs background jobs, idempotency, short-lived cache entries, and rate-limit coordination.
- Docker Compose supplies PostgreSQL and Redis locally when persistence-backed work begins.
- Vitest and Testing Library cover unit and component behavior.
- Playwright covers the critical flow in Chromium, Firefox, WebKit, and mobile emulation.

PostgreSQL and Redis boundaries are defined from the start, but the first UI slice may use in-process fixture repositories so that the application remains runnable before infrastructure credentials exist.

## 5. Data-provider boundary

Market and FX providers implement explicit interfaces. Provider-specific symbols, timestamps, status names, decimal formats, and error payloads are normalized before entering the domain.

```ts
interface MarketDataProvider {
  listAssets(): Promise<CanonicalAsset[]>;
  getSnapshot(request: MarketSnapshotRequest): Promise<MarketSnapshot>;
  getSeries(request: MarketSeriesRequest): Promise<MarketSeries>;
}

interface FxRateProvider {
  listCurrencies(): Promise<CurrencyDefinition[]>;
  getRates(request: FxRateRequest): Promise<FxRateSnapshot>;
}
```

Provider credentials remain server-side. The browser never connects to a privileged provider or receives its secret key.

The local provider returns recorded deterministic fixtures and always reports `dataMode: "fixture"`. Production provider responses report their source, observed time, received time, delay classification, coverage, and quality status.

## 6. Currency model

The interface supports a searchable catalog based on ISO 4217 codes. Availability and quote coverage remain separate concepts: a currency may appear in the catalog but be unavailable for a specific conversion when no trustworthy quote exists.

- Money values cross API and persistence boundaries as decimal strings plus a currency code.
- JavaScript floating-point values are not used for authoritative monetary calculations.
- FX snapshots have a base currency, quote rates, provider, observation time, and freshness classification.
- Cross conversions use a single immutable snapshot so every price in one analysis is internally consistent.
- Locale-aware formatting is presentation-only and never parsed back as an authoritative value without validation.
- Unsupported, stale, or incomplete conversions produce a visible unavailable state rather than an estimated number.

“Real-time” is expressed precisely. The UI shows live, delayed, end-of-day, fixture, or unavailable according to provider metadata. It never labels daily reference rates as live.

## 7. Scan and scoring flow

1. The web application submits amount, currency, horizon, and risk profile to the API.
2. The API validates the request, creates an idempotent analysis request, and returns its identifier and status.
3. The worker obtains immutable market and FX snapshots through provider interfaces.
4. Assets failing freshness, completeness, liquidity, or integrity gates are excluded with structured reasons.
5. Remaining assets are normalized within asset class, market, liquidity tier, and horizon.
6. The deterministic scoring package calculates five dimension scores, total score, confidence, explanations, and primary risk.
7. The result stores methodology version and snapshot identifiers.
8. The web application reads status and renders one primary opportunity plus two alternatives when sufficient qualified assets exist.

For the first local slice, the same contracts execute against deterministic fixture data without a network dependency. The asynchronous status transitions remain real application states, not a fake progress percentage.

## 8. Reliability rules

- No score is emitted when the data-quality gate fails.
- Partial provider failure does not silently fall back to old data.
- A stale result remains readable but is labeled stale and cannot masquerade as a new scan.
- Analysis creation is idempotent for retries using a request key.
- Provider calls use bounded timeouts, limited retries with jitter, and circuit-breaking at the infrastructure boundary.
- Queue jobs are safe to retry and persist their terminal failure reason.
- Every result includes `methodologyVersion`, `dataSnapshotId`, `calculatedAt`, and `dataMode`.
- Health endpoints distinguish process health, dependency readiness, and provider degradation.
- Logs are structured and redact secrets, tokens, exact user amounts, and unnecessary personal information.

## 9. Security foundation

- Environment variables are validated at process startup.
- Secret files and `.env` files are ignored; `.env.example` contains names only.
- All external input is schema validated at the API boundary.
- Secure headers, a restrictive Content Security Policy, rate limits, request-size limits, and origin checks are enabled before production.
- Authentication is hidden behind an application interface so the production identity provider can change without changing domain logic.
- Authorization is checked server-side for every user-owned resource.
- Database access uses least-privilege roles and versioned migrations.
- Dependency updates and security checks run in CI.

## 10. User interface foundation

The interface follows the approved quiet, precise, premium financial direction:

- Dark canvas and surfaces using the approved Phanfora tokens.
- Manrope Variable served locally.
- Tabular numerals for prices, percentages, times, and scores.
- A narrow desktop rail and mobile bottom navigation.
- Strong focus states, 44 × 44 px minimum targets, semantic forms, and keyboard-complete flows.
- Color never carries gain/loss, status, or selection meaning alone.
- Motion is short and informative and respects reduced-motion preferences.
- Charts provide textual summaries and later a data-table alternative.

The first implemented journey prioritizes Today, the guided analysis form, scan state, results, and asset details. Explore, Watchlist, History, and Account receive structurally complete empty or fixture-backed states until their persistence work is scheduled.

## 11. Error behavior

Errors use stable application codes and user-safe localized messages. Provider names and internal traces remain in server logs, not user messages.

- Invalid input returns a field-level correction.
- Unsupported conversion explains which currency pair is unavailable.
- Stale data states when it was last observed.
- Provider degradation preserves navigation and previously stored results.
- Network loss preserves the in-progress form locally and offers retry.
- Session expiry preserves non-sensitive form state and resumes after sign-in.
- A failed scan records its status and never creates an incomplete successful result.

## 12. Testing and quality gates

Development follows test-first red/green/refactor cycles for domain and behavior changes.

Required pull-request checks:

- Dependency installation from the lockfile.
- Formatting and linting.
- Strict TypeScript checking.
- Unit and component tests.
- API integration tests.
- Production builds for all applications.
- Playwright critical-flow tests.
- Migration consistency checks once persistence is introduced.

High-risk domain tests cover decimal currency conversion, snapshot consistency, missing rates, category normalization, horizon weights, risk penalties, quality gates, methodology versioning, idempotency, and stale data.

## 13. Deployment evolution

Local development runs applications through workspace scripts and infrastructure through Docker Compose. The web application can deploy to Vercel. The API and worker remain standard Node.js processes that can initially deploy to a managed container platform. PostgreSQL and Redis use managed services with backups, point-in-time recovery where available, encryption, and regional placement appropriate to the launch market.

This separation avoids coupling long-running scans to a short-lived web request and preserves the option to move hosting providers without rewriting the domain.

## 14. Initial success criteria

The foundation is accepted when:

1. A new developer can install dependencies and start the local application from the README.
2. The guided analysis journey works on desktop and mobile with deterministic fixture data.
3. Fixture data is visibly identified and cannot be confused with live data.
4. Currency selection, formatting, and conversion work against one consistent FX snapshot.
5. A result shows total score, five dimensions, confidence, reasons, risk, methodology, source, freshness, and market status.
6. Invalid, missing, or stale data cannot produce a trustworthy-looking score.
7. Critical unit, integration, component, and browser tests pass.
8. Production builds succeed with no secrets committed.
9. The repository remote points to `BerkayBilgenn/Phanfora.app`.

## 15. Deliberate future work

Licensed real-time providers, production authentication, persisted history, watchlist notifications, observability vendors, multi-region operation, and legal review are introduced as explicit later plans. Their interfaces exist in the foundation, but their operational complexity is not simulated or hidden in the first implementation.

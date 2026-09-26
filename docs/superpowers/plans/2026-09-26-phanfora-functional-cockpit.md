# Phanfora Functional Market Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark glassmorphism market cockpit in which every rendered control uses real Phanfora/Twelve Data state, including OHLCV candles, search, timeframes, indicators, trend lines, fullscreen, radar scanning, opportunity selection, and one-screen analysis.

**Architecture:** Extend the existing domain and provider boundary with validated OHLCV read models, expose those models through Fastify, and keep the React UI dependent only on `apps/web/src/lib/api.ts`. Compose the cockpit from focused accessible components and store only local presentation preferences behind an asynchronous repository interface so a later PostgreSQL implementation can replace browser storage without changing UI consumers.

**Tech Stack:** TypeScript 5.9, Node.js 24, pnpm 9.15, Next.js 16, React 19, Fastify 5, TypeBox, Vitest, Testing Library, Playwright, native SVG, CSS animations, browser Fullscreen API, browser localStorage.

**Spec:** `docs/superpowers/specs/2026-09-26-phanfora-functional-cockpit-design.md`

## Global Constraints

- Do not render a button, navigation item, metric, market count, chart layer, or status unless its behavior and data source are implemented.
- Use only provider-returned market values; fixture values are permitted only in automated tests and must retain `dataMode: "fixture"`.
- Keep `TWELVE_DATA_API_KEY` on the API process; never serialize it or raw provider error bodies to the client.
- Use native SVG and existing dependencies; do not add a charting or animation package.
- Preserve the user's modified `apps/web/src/components/analysis-wizard.test.tsx` contract and implement `AnalysisPanel` to satisfy it.
- Persist only cockpit presentation preferences in localStorage; financial market values must never be treated as durable browser truth.
- Support `prefers-reduced-motion: reduce`, keyboard operation, screen-reader chart summaries, and touch targets of at least `44px`.
- Hide unfinished watchlist, alerts, portfolio, history, reports, and settings destinations until their dedicated functional phases exist.

## Review Focus

- Rapidly changing the timeframe must not allow a slower old request to replace the newest series; Task 6 adds an abort/race test.
- A malformed or schema-old localStorage value must fall back without overwriting the stored value during read; Task 5 adds this repository test.
- Flat prices and zero volumes must still produce finite chart coordinates and an accessible summary; Task 4 adds this math/render test.
- Browsers without Fullscreen API support must not display a dead control; Task 5 adds this capability test.
- Partial live-provider success with fewer than three eligible assets must return an honest analysis failure rather than a fabricated radar ranking; Task 2 adds this API test.

---

## File Structure

### Domain, provider, and API

- Modify `packages/domain/src/index.ts`: OHLCV points, asset-series/overview/scan-summary types.
- Modify `packages/contracts/src/index.ts`: horizon query schema and path parameter schema.
- Modify `packages/market-data/src/index.ts`: provider read methods and deterministic OHLCV fixtures.
- Modify `packages/market-data/src/twelve-data.ts`: validate and normalize complete OHLCV candles.
- Modify `packages/market-data/src/index.test.ts`: fixture OHLCV and overview tests.
- Modify `packages/market-data/src/twelve-data.test.ts`: live normalization and corrupt-candle tests.
- Modify `packages/analysis/src/index.ts`: attach scan metadata to analysis results.
- Modify `packages/analysis/src/index.test.ts`: scan metadata and insufficient-universe tests.
- Modify `apps/api/src/app.ts`: series and overview routes.
- Modify `apps/api/src/app.test.ts`: route, validation, and provider-failure coverage.

### Web data and local state

- Modify `apps/web/src/lib/api.ts`: assets, overview, series fetch functions with `AbortSignal`.
- Create `apps/web/src/lib/chart-math.ts`: pure chart geometry and SMA calculations.
- Create `apps/web/src/lib/chart-math.test.ts`: numerical boundary tests.
- Create `apps/web/src/lib/cockpit-preferences.ts`: repository interface and versioned localStorage implementation.
- Create `apps/web/src/lib/cockpit-preferences.test.ts`: persistence, migration fallback, corrupt-data behavior.

### Web components

- Recreate `apps/web/src/components/analysis-wizard.tsx`: one-screen `AnalysisPanel` matching the user's tests.
- Modify `apps/web/src/components/analysis-wizard.test.tsx`: retain the user's current assertions; only extend loading/error coverage.
- Create `apps/web/src/components/market-chart.tsx`: accessible SVG candles, volume, SMA, crosshair, trend lines.
- Create `apps/web/src/components/market-chart.test.tsx`: chart rendering and accessible summary tests.
- Create `apps/web/src/components/chart-toolbar.tsx`: timeframe, indicators, drawing, fullscreen controls.
- Create `apps/web/src/components/chart-toolbar.test.tsx`: control and capability tests.
- Create `apps/web/src/components/asset-search.tsx`: accessible asset combobox.
- Create `apps/web/src/components/asset-search.test.tsx`: filtering and keyboard tests.
- Create `apps/web/src/components/market-status-bar.tsx`: provider/freshness/coverage status.
- Create `apps/web/src/components/radar-panel.tsx`: request-bound scan state and counts.
- Create `apps/web/src/components/opportunity-list.tsx`: real ranked-result selection.
- Create `apps/web/src/components/metric-modules.tsx`: domain-backed score modules.
- Create `apps/web/src/components/market-cockpit.tsx`: orchestration and stale-request protection.
- Create `apps/web/src/components/market-cockpit.test.tsx`: complete interaction tests.
- Modify `apps/web/src/components/app-shell.tsx`: functional-only navigation and status structure.
- Modify `apps/web/src/app/page.tsx`: render the cockpit.
- Modify `apps/web/src/app/globals.css`: token system, responsive cockpit, glass surfaces, purposeful motion.

### End-to-end

- Modify `e2e/phanfora.spec.ts`: desktop and mobile cockpit journeys.
- Modify `README.md`: current functional scope and local-data behavior.

---

### Task 1: Validate and Preserve Complete OHLCV Data

**Files:**
- Modify: `packages/domain/src/index.ts`
- Modify: `packages/market-data/src/index.ts`
- Modify: `packages/market-data/src/index.test.ts`
- Modify: `packages/market-data/src/twelve-data.ts`
- Modify: `packages/market-data/src/twelve-data.test.ts`
- Modify: `apps/web/src/components/analysis-results.test.tsx`

**Interfaces:**
- Consumes: Twelve Data time-series objects and the existing `Horizon` type.
- Produces: `PricePoint { time, open, high, low, close, volume }` with decimal strings and frozen arrays.

- [ ] **Step 1: Extend provider tests with complete and corrupt candles**

Add assertions that a normalized point contains all fields and that a point with `low > high` is excluded from a usable series:

```ts
expect(candidates[0]?.series[0]).toEqual({
  time: '2026-09-22T10:00:00.000Z',
  open: '98',
  high: '101',
  low: '97',
  close: '100',
  volume: '1200',
});
expect(() => assertValidCandle({
  time: '2026-09-22T10:00:00.000Z',
  open: '100', high: '90', low: '95', close: '98', volume: '10',
})).toThrow('INVALID_OHLCV');
```

Update every `PricePoint` literal in tests, including `analysis-results.test.tsx`, with internally consistent `open`, `high`, and `low` values.

- [ ] **Step 2: Run focused tests and verify the type/test failure**

Run: `pnpm --filter @phanfora/market-data test && pnpm --filter @phanfora/web test -- analysis-results.test.tsx`

Expected: FAIL because `PricePoint` and the live normalizer do not expose or validate OHLC fields.

- [ ] **Step 3: Add the canonical candle type and validator**

Change `PricePoint` and export a validator from `packages/market-data/src/twelve-data.ts`:

```ts
export interface PricePoint {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export function assertValidCandle(point: PricePoint): void {
  const open = Number(point.open);
  const high = Number(point.high);
  const low = Number(point.low);
  const close = Number(point.close);
  const volume = Number(point.volume);
  const values = [open, high, low, close, volume];
  if (values.some((value) => !Number.isFinite(value))
    || volume < 0
    || low > high
    || open < low || open > high
    || close < low || close > high) {
    throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
  }
}
```

Extend `TwelveDataValue` with `open`, `high`, and `low`; normalize all six fields, call `assertValidCandle`, and discard an asset series if any point is corrupt. Update fixture `makeSeries` so each deterministic close has a deterministic body and wick:

```ts
const close = start + slope * index + Math.sin(index) * slope * 0.25;
const open = index === 0 ? close - slope * 0.3 : previousClose;
const high = Math.max(open, close) + Math.abs(slope) * 0.25;
const low = Math.min(open, close) - Math.abs(slope) * 0.25;
return Object.freeze({
  time,
  open: open.toFixed(4),
  high: high.toFixed(4),
  low: low.toFixed(4),
  close: close.toFixed(4),
  volume: String(1_000_000 + index * 84_000),
});
```

- [ ] **Step 4: Run package tests and type checking**

Run: `pnpm --filter @phanfora/market-data test && pnpm --filter @phanfora/market-data typecheck && pnpm --filter @phanfora/analysis test && pnpm --filter @phanfora/web typecheck`

Expected: PASS with all existing close-based scoring behavior unchanged.

- [ ] **Step 5: Commit the OHLCV boundary**

```bash
git add packages/domain/src/index.ts packages/market-data/src/index.ts packages/market-data/src/index.test.ts packages/market-data/src/twelve-data.ts packages/market-data/src/twelve-data.test.ts apps/web/src/components/analysis-results.test.tsx
git commit -m "feat: preserve validated OHLCV market data"
```

### Task 2: Expose Real Series, Overview, and Scan Metadata

**Files:**
- Modify: `packages/domain/src/index.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/market-data/src/index.ts`
- Modify: `packages/market-data/src/twelve-data.ts`
- Modify: `packages/analysis/src/index.ts`
- Modify: `packages/analysis/src/index.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/app.test.ts`

**Interfaces:**
- Consumes: `MarketDataProvider.listAssets()`, `MarketDataProvider.getCandidates(horizon)`, and validated OHLCV.
- Produces: `MarketOverview`, `AssetSeries`, `ScanSummary`, `GET /v1/market/overview`, and `GET /v1/assets/:id/series?horizon=...`.

- [ ] **Step 1: Write failing analysis and API contract tests**

Pin real counts, requested horizon, unknown assets, and insufficient eligible assets:

```ts
expect(result.scanSummary).toEqual({
  scanned: 6,
  eligible: 3,
  excluded: 3,
  byAssetClass: { stock: 2, crypto: 2, commodity: 1, forex: 1, index: 0 },
});

const series = await app.inject({
  method: 'GET',
  url: '/v1/assets/stock%3Aaapl-xnas/series?horizon=weekly',
});
expect(series.statusCode).toBe(200);
expect(series.json().horizon).toBe('weekly');
expect(series.json().series[0]).toMatchObject({ open: expect.any(String), high: expect.any(String) });

const invalid = await app.inject({ method: 'GET', url: '/v1/assets/missing/series?horizon=weekly' });
expect(invalid.statusCode).toBe(404);
```

Add a service test where only two candidates pass quality gates and assert rejection with `INSUFFICIENT_ELIGIBLE_ASSETS`.

- [ ] **Step 2: Run focused tests and verify route/type failures**

Run: `pnpm --filter @phanfora/analysis test && pnpm --filter @phanfora/api test`

Expected: FAIL because scan metadata and the two read routes do not exist.

- [ ] **Step 3: Define exact read models and provider methods**

Add domain interfaces:

```ts
export interface MarketOverview {
  assetCount: number;
  byAssetClass: Readonly<Record<AssetClass, number>>;
  provider: string;
  dataMode: DataMode;
  observedAt: string | null;
}

export interface AssetSeries {
  asset: CanonicalAsset;
  horizon: Horizon;
  series: readonly PricePoint[];
  source: string;
  observedAt: string;
  freshness: Freshness;
  dataMode: DataMode;
  quality: QualityMetadata;
}

export interface ScanSummary {
  scanned: number;
  eligible: number;
  excluded: number;
  byAssetClass: Readonly<Record<AssetClass, number>>;
}
```

Add these provider signatures:

```ts
getSeries(id: string, horizon: Horizon): Promise<AssetSeries>;
getOverview(): Promise<MarketOverview>;
```

Implement both providers using their existing canonical catalog and cached candidate batches. `getSeries` throws `ASSET_NOT_FOUND` when the catalog lacks the id and `MARKET_DATA_UNAVAILABLE` when the provider returned no usable series for a known id. Preserve `quality.completeness` in `AssetSeries`; do not interpolate missing candles. The web layer will label a series with completeness below `1` as partial and will refuse to chart it when it fails the existing quality gate.

- [ ] **Step 4: Add TypeBox query/path validation and Fastify routes**

Define schemas:

```ts
export const HorizonQuerySchema = Type.Object({
  horizon: Type.Union([Type.Literal('daily'), Type.Literal('weekly'), Type.Literal('monthly')]),
}, { additionalProperties: false });

export const AssetIdParamsSchema = Type.Object({ id: Type.String({ minLength: 1, maxLength: 128 }) });
```

Register routes with those schemas, URL-decode the path value through Fastify's params handling, and map `ASSET_NOT_FOUND` to 404. Extend `AnalysisResult` with `scanSummary`, calculated from the pre-filter candidate set and quality-gate results; do not maintain a second radar algorithm.

- [ ] **Step 5: Run package and API verification**

Run: `pnpm --filter @phanfora/analysis test && pnpm --filter @phanfora/api test && pnpm --filter @phanfora/api typecheck`

Expected: PASS, including the fewer-than-three eligible-assets failure.

- [ ] **Step 6: Commit the cockpit read API**

```bash
git add packages/domain/src/index.ts packages/contracts/src/index.ts packages/market-data/src/index.ts packages/market-data/src/twelve-data.ts packages/analysis/src/index.ts packages/analysis/src/index.test.ts apps/api/src/app.ts apps/api/src/app.test.ts
git commit -m "feat: expose market cockpit read models"
```

### Task 3: Restore the User's One-Screen Analysis Panel

**Files:**
- Recreate: `apps/web/src/components/analysis-wizard.tsx`
- Modify: `apps/web/src/components/analysis-wizard.test.tsx`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: `CurrencyDefinition[]`, `parseMoneyInput`, and `onSubmit(AnalysisInput)`.
- Produces: `AnalysisPanel({ currencies, onSubmit, busy })` with all controls visible and one submit action.

- [ ] **Step 1: Preserve the current user-authored tests and add loading coverage**

Keep the three existing `AnalysisPanel` tests unchanged and add:

```ts
it('disables the submit action while an analysis is running', () => {
  render(<AnalysisPanel currencies={currencies} onSubmit={vi.fn()} busy />);
  expect(screen.getByRole('button', { name: 'Piyasalar analiz ediliyor' })).toBeDisabled();
});
```

- [ ] **Step 2: Run the component test and verify the missing-module failure**

Run: `pnpm --filter @phanfora/web test -- analysis-wizard.test.tsx`

Expected: FAIL because `analysis-wizard.tsx` is currently deleted and `AnalysisPanel` does not exist.

- [ ] **Step 3: Implement the complete single-screen panel**

Recreate the file with these state defaults and submit boundary:

```ts
export function AnalysisPanel({ currencies, onSubmit, busy = false }: AnalysisPanelProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [horizon, setHorizon] = useState<Horizon>('daily');
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('balanced');
  const [error, setError] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  async function submit() {
    try {
      const money = parseMoneyInput(amount, currency, 'tr-TR');
      if (!currencies.some((item) => item.code === currency)) throw new Error('UNSUPPORTED_CURRENCY');
      setError('');
      await onSubmit({ amount: money, horizon, riskProfile, locale: 'tr-TR' });
    } catch {
      setError('Geçerli bir tutar gir ve listeden bir para birimi seç.');
      amountRef.current?.focus();
    }
  }
```

Render a heading named `Analiz ayarları`, the existing `CurrencyCombobox`, both labeled fieldsets, `6 canlı enstrüman`, `4 varlık sınıfı`, and a single button whose accessible name is `Canlı piyasaları analiz et` or `Piyasalar analiz ediliyor` while busy.

- [ ] **Step 4: Run component tests and type checking**

Run: `pnpm --filter @phanfora/web test -- analysis-wizard.test.tsx && pnpm --filter @phanfora/web typecheck`

Expected: PASS with no step counter or `Devam et` control.

- [ ] **Step 5: Commit the preserved user flow**

```bash
git add apps/web/src/components/analysis-wizard.tsx apps/web/src/components/analysis-wizard.test.tsx apps/web/src/app/page.tsx
git commit -m "feat: restore single-screen analysis controls"
```

### Task 4: Build Deterministic Chart Geometry and Accessible SVG Rendering

**Files:**
- Create: `apps/web/src/lib/chart-math.ts`
- Create: `apps/web/src/lib/chart-math.test.ts`
- Create: `apps/web/src/components/market-chart.tsx`
- Create: `apps/web/src/components/market-chart.test.tsx`
- Remove: `apps/web/src/components/price-chart.tsx`

**Interfaces:**
- Consumes: `readonly PricePoint[]`, viewport width/height, active SMA periods, and trend-line points.
- Produces: `buildChartModel`, `simpleMovingAverage`, and `MarketChart` with finite SVG coordinates and accessible descriptions.

- [ ] **Step 1: Write chart-math tests for normal, flat, and zero-volume series**

```ts
expect(simpleMovingAverage([10, 20, 30, 40], 3)).toEqual([null, null, 20, 30]);

const flat = buildChartModel([
  candle('10', '10', '10', '10', '0'),
  candle('10', '10', '10', '10', '0'),
], { width: 800, height: 360 });
expect(flat.candles.every((item) => Object.values(item).every(Number.isFinite))).toBe(true);
expect(flat.priceDomain[1]).toBeGreaterThan(flat.priceDomain[0]);
```

Render `MarketChart` and assert `role="img"`, the selected asset name, first/last prices, and a focusable candle detail control are present.

- [ ] **Step 2: Run the new tests and verify missing-module failures**

Run: `pnpm --filter @phanfora/web test -- chart-math.test.ts market-chart.test.tsx`

Expected: FAIL because the math and component modules do not exist.

- [ ] **Step 3: Implement pure chart calculations**

Export these exact types/functions:

```ts
export interface ChartSize { width: number; height: number }
export interface CandleGeometry {
  index: number; x: number; width: number;
  openY: number; highY: number; lowY: number; closeY: number;
  volumeY: number; volumeHeight: number; rising: boolean;
}
export interface ChartModel {
  candles: readonly CandleGeometry[];
  priceDomain: readonly [number, number];
  volumeMax: number;
  plot: { left: number; top: number; right: number; bottom: number; volumeTop: number };
}
export function simpleMovingAverage(values: readonly number[], period: number): readonly (number | null)[];
export function buildChartModel(series: readonly PricePoint[], size: ChartSize): ChartModel;
```

Use a 2% padding around a non-flat price range and `Math.max(max - min, Math.abs(max) * 0.01, 1e-8)` for a flat range. Use `Math.max(...volumes, 1)` for volume scaling so zero-volume points remain finite.

- [ ] **Step 4: Implement the SVG chart without decorative data**

Render one wick `<line>` and one body `<rect>` per point, volume bars from the same point, optional SMA polylines, and real axis labels derived from the domain. Each candle receives a keyboard-focusable transparent hit target that updates a live detail region. The figure description must state the asset, interval, first close, last close, minimum low, maximum high, and point count.

Replace all `PriceChart` imports with `MarketChart` only after providing required props. Do not keep the old line chart as an unused fallback.

- [ ] **Step 5: Run chart and dependent result tests**

Run: `pnpm --filter @phanfora/web test -- chart-math.test.ts market-chart.test.tsx analysis-results.test.tsx && pnpm --filter @phanfora/web typecheck`

Expected: PASS, including finite coordinates for flat/zero-volume input.

- [ ] **Step 6: Commit the real chart renderer**

```bash
git add apps/web/src/lib/chart-math.ts apps/web/src/lib/chart-math.test.ts apps/web/src/components/market-chart.tsx apps/web/src/components/market-chart.test.tsx apps/web/src/components/analysis-results.tsx apps/web/src/components/analysis-results.test.tsx apps/web/src/components/price-chart.tsx
git commit -m "feat: render accessible OHLCV market charts"
```

### Task 5: Add Functional Chart Controls and Versioned Local Preferences

**Files:**
- Create: `apps/web/src/lib/cockpit-preferences.ts`
- Create: `apps/web/src/lib/cockpit-preferences.test.ts`
- Create: `apps/web/src/components/chart-toolbar.tsx`
- Create: `apps/web/src/components/chart-toolbar.test.tsx`
- Modify: `apps/web/src/components/market-chart.tsx`
- Modify: `apps/web/src/components/market-chart.test.tsx`

**Interfaces:**
- Consumes: `Horizon`, indicator set, trend lines, and an optional fullscreen target ref.
- Produces: `CockpitPreferencesRepository`, `createLocalCockpitPreferencesRepository`, `ChartToolbar`, and two-point trend-line interactions.

- [ ] **Step 1: Write failing repository and toolbar capability tests**

```ts
localStorage.setItem('phanfora:cockpit:v1', '{bad-json');
const repository = createLocalCockpitPreferencesRepository(localStorage);
await expect(repository.load()).resolves.toEqual(DEFAULT_COCKPIT_PREFERENCES);
expect(localStorage.getItem('phanfora:cockpit:v1')).toBe('{bad-json');

Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });
render(<ChartToolbar value={props} />);
expect(screen.queryByRole('button', { name: 'Grafiği tam ekran aç' })).not.toBeInTheDocument();
```

Add interaction assertions for weekly selection, SMA 20 toggling, drawing mode, clear drawings, the `Hareketi azalt` preference, and fullscreen when supported.

- [ ] **Step 2: Run focused tests and verify missing modules**

Run: `pnpm --filter @phanfora/web test -- cockpit-preferences.test.ts chart-toolbar.test.tsx market-chart.test.tsx`

Expected: FAIL because the repository and toolbar do not exist.

- [ ] **Step 3: Implement a versioned asynchronous preference repository**

```ts
export interface TrendLine {
  id: string;
  startIndex: number;
  startPrice: number;
  endIndex: number;
  endPrice: number;
}

export interface CockpitPreferences {
  version: 1;
  assetId: string | null;
  horizon: Horizon;
  indicators: readonly ('sma20' | 'sma50')[];
  drawings: Readonly<Record<string, readonly TrendLine[]>>;
  motion: 'system' | 'reduced';
}

export interface CockpitPreferencesRepository {
  load(): Promise<CockpitPreferences>;
  save(value: CockpitPreferences): Promise<void>;
}
```

Validate parsed values with explicit property checks. On invalid JSON/version/schema, return an immutable default and leave storage untouched. `save` writes only the versioned preference object.

- [ ] **Step 4: Implement only working toolbar controls**

Render three timeframe buttons, a menu with SMA 20/SMA 50 checkboxes, a drawing toggle, a clear-drawings action only when drawings exist, a `Hareketi azalt` switch backed by `preferences.motion`, and a fullscreen action only when `document.fullscreenEnabled` and the target exposes `requestFullscreen`. Use `aria-pressed` for toggles and return focus to the menu trigger after closing. Apply a `data-motion="reduced"` attribute to the cockpit root when the explicit local preference requests reduced motion.

In `MarketChart`, drawing mode converts two pointer selections through inverse chart scales into `TrendLine` values. Render persisted lines using the same scales; selecting a line exposes a keyboard-operable delete action.

- [ ] **Step 5: Run component and repository verification**

Run: `pnpm --filter @phanfora/web test -- cockpit-preferences.test.ts chart-toolbar.test.tsx market-chart.test.tsx && pnpm --filter @phanfora/web typecheck`

Expected: PASS, including corrupt-storage and unsupported-fullscreen behavior.

- [ ] **Step 6: Commit functional chart tooling**

```bash
git add apps/web/src/lib/cockpit-preferences.ts apps/web/src/lib/cockpit-preferences.test.ts apps/web/src/components/chart-toolbar.tsx apps/web/src/components/chart-toolbar.test.tsx apps/web/src/components/market-chart.tsx apps/web/src/components/market-chart.test.tsx
git commit -m "feat: add functional chart controls"
```

### Task 6: Orchestrate Search, Status, Series Loading, and Request Races

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/components/asset-search.tsx`
- Create: `apps/web/src/components/asset-search.test.tsx`
- Create: `apps/web/src/components/market-status-bar.tsx`
- Create: `apps/web/src/components/market-cockpit.tsx`
- Create: `apps/web/src/components/market-cockpit.test.tsx`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: `fetchAssets(signal)`, `fetchMarketOverview(signal)`, `fetchAssetSeries(id, horizon, signal)`, preference repository, chart and toolbar.
- Produces: searchable, loadable `MarketCockpit` that ignores aborted/out-of-order responses.

- [ ] **Step 1: Write failing search and orchestration tests**

Test symbol/name filtering, ArrowDown/Enter selection, Escape closing, and race safety. Resolve a weekly request after a newer monthly request and assert the monthly series stays visible:

```ts
await user.click(screen.getByRole('button', { name: 'Haftalık' }));
await user.click(screen.getByRole('button', { name: 'Aylık' }));
monthly.resolve(monthlySeries);
weekly.resolve(weeklySeries);
expect(await screen.findByText('90 veri noktası')).toBeInTheDocument();
expect(screen.queryByText('60 veri noktası')).not.toBeInTheDocument();
```

Use fake timers to assert that overview refresh pauses while `document.visibilityState === 'hidden'`, resumes when visible, and keeps the last successful overview on a refresh error while changing the status label to `Bağlantı kesildi`.

- [ ] **Step 2: Run focused tests and verify missing component/API failures**

Run: `pnpm --filter @phanfora/web test -- asset-search.test.tsx market-cockpit.test.tsx`

Expected: FAIL because the components and read API functions do not exist.

- [ ] **Step 3: Add abortable web API readers**

```ts
export async function fetchAssets(signal?: AbortSignal): Promise<CanonicalAsset[]>;
export async function fetchMarketOverview(signal?: AbortSignal): Promise<MarketOverview>;
export async function fetchAssetSeries(
  id: string,
  horizon: Horizon,
  signal?: AbortSignal,
): Promise<AssetSeries>;
```

Pass `signal` to `fetch`, encode asset ids with `encodeURIComponent`, and reuse `expectJson`. Do not convert aborts into user-facing provider failures.

- [ ] **Step 4: Implement accessible search and truthful status**

`AssetSearch` uses combobox/listbox semantics, filters the already-loaded catalog, and emits the selected canonical asset. `MarketStatusBar` renders provider, data mode, asset count, observed time, completeness/partial-data state, and a freshness label; it never renders benchmark prices because no benchmark endpoint exists.

- [ ] **Step 5: Implement cockpit loading with AbortController**

On asset/horizon change, abort the previous controller before requesting the next series:

```ts
useEffect(() => {
  if (!selectedAsset) return;
  const controller = new AbortController();
  setSeriesState({ status: 'loading' });
  void fetchAssetSeries(selectedAsset.id, horizon, controller.signal)
    .then((value) => setSeriesState({ status: 'ready', value }))
    .catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setSeriesState({ status: 'error', message: toUserMessage(error) });
    });
  return () => controller.abort();
}, [selectedAsset, horizon]);
```

Load saved preferences once, select the saved asset if it exists in the current catalog, otherwise select the first real asset, and render explicit loading/error/empty states.

Refresh `MarketOverview` no more often than every 60 seconds, only while `document.visibilityState === 'visible'`. Listen for `visibilitychange` to resume. A failed refresh keeps the last successful overview and marks it offline; initial load failure renders the provider error because there is no trustworthy snapshot to retain.

- [ ] **Step 6: Run race, keyboard, and type verification**

Run: `pnpm --filter @phanfora/web test -- asset-search.test.tsx market-cockpit.test.tsx && pnpm --filter @phanfora/web typecheck`

Expected: PASS; the monthly response remains after the older weekly promise resolves.

- [ ] **Step 7: Commit the data-driven cockpit shell**

```bash
git add apps/web/src/lib/api.ts apps/web/src/components/asset-search.tsx apps/web/src/components/asset-search.test.tsx apps/web/src/components/market-status-bar.tsx apps/web/src/components/market-cockpit.tsx apps/web/src/components/market-cockpit.test.tsx apps/web/src/app/page.tsx
git commit -m "feat: orchestrate the live market cockpit"
```

### Task 7: Connect Real Radar Scanning, Opportunities, and Metrics

**Files:**
- Create: `apps/web/src/components/radar-panel.tsx`
- Create: `apps/web/src/components/opportunity-list.tsx`
- Create: `apps/web/src/components/metric-modules.tsx`
- Modify: `apps/web/src/components/market-cockpit.tsx`
- Modify: `apps/web/src/components/market-cockpit.test.tsx`
- Modify: `apps/web/src/components/analysis-results.tsx`
- Modify: `apps/web/src/components/asset-card.tsx`
- Modify: `apps/web/src/components/score-breakdown.tsx`
- Modify: `apps/web/src/components/scan-progress.tsx`

**Interfaces:**
- Consumes: `AnalysisPanel`, `createAnalysis`, `AnalysisResult.scanSummary`, `ScoreResult`, and selected-asset callback.
- Produces: request-bound radar state, real ranked opportunities, and domain-backed KPI modules.

- [ ] **Step 1: Add failing full-flow tests**

Render `MarketCockpit` with injected API functions. Submit the analysis panel and assert:

```ts
expect(screen.getByText('6 varlık tarandı')).toBeInTheDocument();
expect(screen.getByText('3 uygun fırsat')).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: /Apple Inc\. sonucunu aç/ }));
expect(screen.getByRole('heading', { name: /Apple Inc\./ })).toBeInTheDocument();
expect(screen.getByText('Momentum')).toBeInTheDocument();
expect(screen.getByText('84')).toBeInTheDocument();
```

Add an error test that rejects analysis and asserts the previous series remains visible while the radar reports the API message.

- [ ] **Step 2: Run the cockpit tests and verify missing radar modules**

Run: `pnpm --filter @phanfora/web test -- market-cockpit.test.tsx analysis-results.test.tsx`

Expected: FAIL because the new scan/result modules are absent.

- [ ] **Step 3: Implement request-bound radar and opportunity selection**

`RadarPanel` receives this discriminated union:

```ts
type RadarState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'ready'; summary: ScanSummary }
  | { status: 'error'; message: string };
```

Animate the scan beam only for `scanning`. For `ready`, display `scanned`, `eligible`, and `excluded` exactly. `OpportunityList` renders primary plus alternatives as buttons with symbol, natural price, change, score, and accessible selection names.

- [ ] **Step 4: Implement metric modules from the selected score result**

Map values without inventing new calculations:

```ts
const metrics = [
  ['Momentum', result.dimensionScores.momentum],
  ['Likidite', result.dimensionScores.liquidity],
  ['Volatilite uyumu', result.dimensionScores.riskFit],
  ['Piyasa koşulları', result.dimensionScores.marketConditions],
] as const;
```

Each module includes a labeled numeric value and a progress visualization with `aria-valuenow`. Do not render a sparkline unless a real time series supports it.

- [ ] **Step 5: Integrate analysis without replacing the cockpit page**

Keep `MarketCockpit` mounted during analysis. Submitting sets radar to `scanning`; success sets the primary score result as selected, updates the opportunities and chart series, and persists the selected asset/horizon. Failure sets only radar/error state and keeps the last successful chart.

Remove the old full-page `ScanProgress` branch from `page.tsx`. Keep or delete `scan-progress.tsx` according to remaining imports; no unused decorative scan screen remains.

- [ ] **Step 6: Run web flow verification**

Run: `pnpm --filter @phanfora/web test -- market-cockpit.test.tsx analysis-results.test.tsx analysis-wizard.test.tsx && pnpm --filter @phanfora/web typecheck`

Expected: PASS with real scan summary counts and selectable results.

- [ ] **Step 7: Commit radar and analysis integration**

```bash
git add apps/web/src/components/radar-panel.tsx apps/web/src/components/opportunity-list.tsx apps/web/src/components/metric-modules.tsx apps/web/src/components/market-cockpit.tsx apps/web/src/components/market-cockpit.test.tsx apps/web/src/components/analysis-results.tsx apps/web/src/components/asset-card.tsx apps/web/src/components/score-breakdown.tsx apps/web/src/components/scan-progress.tsx apps/web/src/app/page.tsx
git commit -m "feat: connect real radar analysis results"
```

### Task 8: Apply the Bespoke Glassmorphism System and Purposeful Motion

**Files:**
- Modify: `apps/web/src/components/app-shell.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/components/market-cockpit.test.tsx`

**Interfaces:**
- Consumes: semantic class names from Tasks 3-7 and actual loading/selected/error states.
- Produces: responsive cockpit layout, restrained glass surfaces, and state-bound animations.

- [ ] **Step 1: Add structural and accessibility assertions before styling**

Assert that unfinished destinations are absent, active navigation is exposed, and status/error contrast hooks exist:

```ts
expect(screen.queryByRole('link', { name: 'Portföy' })).not.toBeInTheDocument();
expect(screen.queryByRole('link', { name: 'Alarmlar' })).not.toBeInTheDocument();
expect(screen.getByRole('link', { name: 'Piyasa kontrol merkezi' })).toHaveAttribute('aria-current', 'page');
expect(screen.getByRole('main')).toHaveClass('cockpit-main');
```

- [ ] **Step 2: Run the structural test and verify it fails**

Run: `pnpm --filter @phanfora/web test -- market-cockpit.test.tsx`

Expected: FAIL because the old shell still renders unfinished destinations and lacks the cockpit structure.

- [ ] **Step 3: Replace the shell with functional-only navigation**

Keep the Phanfora home/control-center link and profile/locale controls only if they perform a behavior. If locale switching and account settings are not implemented in this phase, render locale as plain status text and omit the profile button. Preserve the skip link and semantic `<main>`.

- [ ] **Step 4: Implement tokens and surface hierarchy**

Define the approved tokens and use them consistently:

```css
:root {
  --canvas: #071015;
  --canvas-raised: #0a171d;
  --glass-primary: rgba(12, 31, 38, .78);
  --surface-secondary: rgba(13, 28, 34, .94);
  --line: rgba(177, 224, 211, .13);
  --line-active: rgba(123, 224, 189, .58);
  --text-primary: #eef7f4;
  --text-secondary: #9fb4b1;
  --mint: #7be0bd;
  --amber: #e4b56a;
  --coral: #ef7d78;
  --radius-control: 6px;
  --radius-card: 10px;
  --radius-panel: 14px;
}
```

Use glass only on the chart, radar, and analysis panel. KPI modules use the opaque secondary surface. Use an 8px spacing rhythm, tabular numerals, hairline borders, and mint only for live/selected/positive states.

- [ ] **Step 5: Add state-bound motion and responsive layouts**

Implement chart entry, scanning beam, status pulse, and panel transitions only on real states. Use `transform` and `opacity`; do not animate layout dimensions. At `62rem`, stack the secondary column; at `42rem`, use a single-column flow, at least `44px` controls, reduced tick density, and no horizontal page scrolling.

Add the reduced-motion override:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

- [ ] **Step 6: Run web tests, lint, and type checking**

Run: `pnpm --filter @phanfora/web test && pnpm --filter @phanfora/web lint && pnpm --filter @phanfora/web typecheck`

Expected: PASS with no links to unfinished product areas.

- [ ] **Step 7: Commit the final visual system**

```bash
git add apps/web/src/components/app-shell.tsx apps/web/src/app/globals.css apps/web/src/app/layout.tsx apps/web/src/components/market-cockpit.test.tsx
git commit -m "feat: apply Phanfora cockpit design system"
```

### Task 9: Verify the Complete Local Product Journey

**Files:**
- Modify: `e2e/phanfora.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: the complete API and web cockpit from Tasks 1-8.
- Produces: deterministic desktop/mobile journeys and accurate local-running documentation.

- [ ] **Step 1: Replace stale E2E expectations with the real cockpit journey**

Add a desktop scenario that:

```ts
await page.goto('/');
await expect(page.getByRole('heading', { name: 'Piyasa Kontrol Merkezi' })).toBeVisible();
await page.getByRole('combobox', { name: 'Varlık ara' }).fill('Bitcoin');
await page.getByRole('option', { name: /Bitcoin/ }).click();
await page.getByRole('button', { name: 'Haftalık' }).click();
await page.getByRole('button', { name: 'Göstergeler' }).click();
await page.getByRole('checkbox', { name: 'SMA 20' }).check();
await expect(page.getByRole('img', { name: /Bitcoin.*mum grafiği/ })).toBeVisible();
await page.getByLabel('Değerlendirilecek tutar').fill('25000');
await page.getByRole('button', { name: 'Canlı piyasaları analiz et' }).click();
await expect(page.getByText(/varlık tarandı/)).toBeVisible();
await expect(page.getByRole('button', { name: /sonucunu aç/ }).first()).toBeVisible();
```

Add a mobile scenario that completes the same core flow without horizontal viewport overflow and a keyboard-only scenario that selects a searched asset and reaches the analysis action.

- [ ] **Step 2: Run Chromium E2E and observe any integration failure**

Run: `pnpm test:e2e --project=chromium`

Expected: The first run may fail only on integration defects exposed by the complete journey; record the exact failing assertion before editing product code.

- [ ] **Step 3: Fix only evidence-backed integration defects**

For each failure, add or tighten the nearest unit/integration test before changing implementation. Keep the E2E selectors role/name based. Do not add arbitrary timeouts; wait on visible UI state or network completion.

- [ ] **Step 4: Update the README to match actual behavior**

Document the functional cockpit, real OHLCV chart controls, supported six-instrument live universe, local-only preferences, provider-key requirement, and the fact that watchlist/alerts/portfolio/history/reports are not rendered until their functional phases.

- [ ] **Step 5: Run the complete verification suite**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e --project=chromium
```

Expected: every command exits 0. Confirm `git diff --check` emits no output and `git status --short` contains only intentional tracked changes.

- [ ] **Step 6: Commit the verified journey and documentation**

```bash
git add e2e/phanfora.spec.ts README.md
git commit -m "test: verify functional cockpit journey"
```

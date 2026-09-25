# Phanfora App

Phanfora turns an amount, investment horizon, and risk preference into a short, explainable ranking of global market opportunities. This repository contains the application for `app.phanfora.com`; the landing page at `phanfora.com` remains independently deployed.

> **Fixture-only release:** Every market result in Phase 1 is deterministic demonstration data. Nothing in this repository may be presented as live market data or investment execution.

## Local development

Node.js 22 is required. The repository includes `.nvmrc`:

```bash
nvm use
npm install
npm run dev
```

Open `http://localhost:3000`. Run the full local quality gate with:

```bash
npm run check
npm run test:e2e
```

`npm run check` runs ESLint, strict TypeScript, Vitest, and a production build. Browser tests start their own isolated server on port 3106 and run desktop and mobile Chromium projects.

## Phase 1 routes

- `/` — localized amount, horizon, and risk flow with deterministic results
- `/analysis` — stable fixture result surface for direct review
- `/methodology` — Turkish and English scoring methodology

## Delivery plans

The approved product is decomposed into five independently runnable plans:

1. Foundation — this vertical slice
2. Market Data — next
3. Scoring Engine
4. Accounts and Persistence
5. Production Integration

The approved product spec and foundation plan live under `docs/superpowers/`.

## Environment policy

`.env*` files are ignored except `.env.example`. Never commit credentials. A secret must never use a `NEXT_PUBLIC_` prefix; that prefix is reserved for values intentionally safe to expose in browser bundles.

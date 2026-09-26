export type CurrencyCode = string;
export type DataMode = 'fixture' | 'live' | 'delayed' | 'end-of-day';
export type Freshness = 'live' | 'delayed' | 'end-of-day' | 'stale' | 'fixture';
export type Horizon = 'daily' | 'weekly' | 'monthly';
export type RiskProfile = 'low' | 'balanced' | 'high';
export type AssetClass = 'stock' | 'crypto' | 'commodity' | 'forex' | 'index';
export type MarketStatus = 'open' | 'closed' | 'continuous' | 'unknown';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface Money {
  amount: string;
  currency: CurrencyCode;
}

export interface CurrencyDefinition {
  code: CurrencyCode;
  name: string;
  symbol: string;
  minorUnits: number;
}

export interface FxRateSnapshot {
  id: string;
  baseCurrency: CurrencyCode;
  rates: Readonly<Record<CurrencyCode, string>>;
  provider: string;
  observedAt: string;
  freshness: Freshness;
  dataMode: DataMode;
}

export interface AnalysisInput {
  amount: Money;
  horizon: Horizon;
  riskProfile: RiskProfile;
  locale: 'tr-TR' | 'en-US';
}

export interface CanonicalAsset {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  exchangeOrVenue: string;
  quoteCurrency: CurrencyCode;
  liquidityTier: 'high' | 'medium' | 'low';
}

export interface PricePoint {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface QualityMetadata {
  freshness: Freshness;
  completeness: number;
  integrity: 'verified' | 'suspect';
}

export interface DimensionScores {
  trend: number;
  momentum: number;
  liquidity: number;
  riskFit: number;
  marketConditions: number;
}

export interface MarketCandidate {
  asset: CanonicalAsset;
  price: Money;
  changePercent: string;
  dimensions: DimensionScores;
  volatility: number;
  quality: QualityMetadata;
  marketStatus: MarketStatus;
  series: readonly PricePoint[];
  source: string;
  observedAt: string;
  snapshotId: string;
  dataMode: DataMode;
}

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

export interface RankedAsset {
  asset: CanonicalAsset;
  price: Money;
  convertedPrice: Money;
  changePercent: string;
  totalScore: number;
  confidenceLevel: ConfidenceLevel;
  dimensionScores: DimensionScores;
  reasons: readonly string[];
  primaryRisk: string;
  marketStatus: MarketStatus;
  series: readonly PricePoint[];
  source: string;
  observedAt: string;
  freshness: Freshness;
}

export interface ScoreResult extends RankedAsset {
  methodologyVersion: 'phanfora-v1';
  dataSnapshotId: string;
  calculatedAt: string;
  dataMode: DataMode;
}

export interface QualityGateFailure {
  ok: false;
  assetId: string;
  reason: 'STALE_DATA' | 'INCOMPLETE_DATA' | 'LOW_LIQUIDITY' | 'SUSPECT_DATA';
}

export interface AnalysisResult {
  id: string;
  status: 'completed';
  input: AnalysisInput;
  primary: ScoreResult;
  alternatives: readonly [ScoreResult, ScoreResult];
  excluded: readonly QualityGateFailure[];
  methodologyVersion: 'phanfora-v1';
  dataSnapshotId: string;
  calculatedAt: string;
  dataMode: DataMode;
  fxSnapshot: FxRateSnapshot;
  scanSummary: ScanSummary;
}

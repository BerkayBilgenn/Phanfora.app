import type { Horizon } from '@phanfora/domain';

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

const storageKey = 'phanfora:cockpit:v1';

export const DEFAULT_COCKPIT_PREFERENCES: CockpitPreferences = Object.freeze({
  version: 1,
  assetId: null,
  horizon: 'daily',
  indicators: Object.freeze([]),
  drawings: Object.freeze({}),
  motion: 'system',
});

function isTrendLine(value: unknown): value is TrendLine {
  if (!value || typeof value !== 'object') return false;
  const line = value as Record<string, unknown>;
  return typeof line.id === 'string'
    && ['startIndex', 'startPrice', 'endIndex', 'endPrice']
      .every((key) => typeof line[key] === 'number' && Number.isFinite(line[key]));
}

function isPreferences(value: unknown): value is CockpitPreferences {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1
    || !(candidate.assetId === null || typeof candidate.assetId === 'string')
    || !['daily', 'weekly', 'monthly'].includes(String(candidate.horizon))
    || !Array.isArray(candidate.indicators)
    || candidate.indicators.some((item) => item !== 'sma20' && item !== 'sma50')
    || (candidate.motion !== 'system' && candidate.motion !== 'reduced')
    || !candidate.drawings
    || typeof candidate.drawings !== 'object'
    || Array.isArray(candidate.drawings)) return false;

  return Object.values(candidate.drawings as Record<string, unknown>)
    .every((lines) => Array.isArray(lines) && lines.every(isTrendLine));
}

function freezePreferences(value: CockpitPreferences): CockpitPreferences {
  const drawings = Object.fromEntries(Object.entries(value.drawings).map(([key, lines]) => [
    key,
    Object.freeze(lines.map((line) => Object.freeze({ ...line }))),
  ]));
  return Object.freeze({
    ...value,
    indicators: Object.freeze([...new Set(value.indicators)]),
    drawings: Object.freeze(drawings),
  });
}

export function createLocalCockpitPreferencesRepository(storage: Storage): CockpitPreferencesRepository {
  return {
    async load() {
      const serialized = storage.getItem(storageKey);
      if (!serialized) return DEFAULT_COCKPIT_PREFERENCES;
      try {
        const parsed: unknown = JSON.parse(serialized);
        return isPreferences(parsed) ? freezePreferences(parsed) : DEFAULT_COCKPIT_PREFERENCES;
      } catch {
        return DEFAULT_COCKPIT_PREFERENCES;
      }
    },
    async save(value) {
      if (!isPreferences(value)) throw new Error('INVALID_COCKPIT_PREFERENCES');
      storage.setItem(storageKey, JSON.stringify(value));
    },
  };
}

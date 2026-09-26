import Decimal from 'decimal.js';

import type {
  CurrencyCode,
  CurrencyDefinition,
  FxRateSnapshot,
  Money,
} from '@phanfora/domain';

const ISO_4217_CODES = [
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
  'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BOV',
  'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHE', 'CHF',
  'CHW', 'CLF', 'CLP', 'CNY', 'COP', 'COU', 'CRC', 'CUP', 'CVE', 'CZK',
  'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP',
  'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL',
  'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD',
  'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT',
  'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD',
  'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MXV', 'MYR',
  'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN',
  'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF',
  'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS', 'SRD',
  'SSP', 'STN', 'SVC', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP',
  'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'USN', 'UYI', 'UYU',
  'UYW', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XAG', 'XAU', 'XBA',
  'XBB', 'XBC', 'XBD', 'XCD', 'XDR', 'XOF', 'XPD', 'XPF', 'XPT', 'XSU',
  'XTS', 'XUA', 'XXX', 'YER', 'ZAR', 'ZMW', 'ZWG',
] as const;

function currencyDefinition(code: string, locale: string): CurrencyDefinition {
  const displayNames = new Intl.DisplayNames([locale], { type: 'currency' });
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
  });
  const parts = formatter.formatToParts(0);
  const symbol = parts.find((part) => part.type === 'currency')?.value ?? code;

  return {
    code,
    name: displayNames.of(code) ?? code,
    symbol,
    minorUnits: formatter.resolvedOptions().maximumFractionDigits ?? 2,
  };
}

export function listCurrencies(locale = 'tr-TR'): CurrencyDefinition[] {
  return ISO_4217_CODES.map((code) => currencyDefinition(code, locale));
}

export function searchCurrencies(
  query: string,
  locale = 'tr-TR',
): CurrencyDefinition[] {
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const currencies = listCurrencies(locale);
  if (!normalizedQuery) return currencies;

  return currencies.filter((currency) => {
    const haystack = `${currency.code} ${currency.name} ${currency.symbol}`
      .toLocaleLowerCase(locale);
    return haystack.includes(normalizedQuery);
  });
}

export function parseMoneyInput(
  rawValue: string,
  currency: CurrencyCode,
  locale: string,
): Money {
  const trimmed = rawValue.trim().replaceAll('\u00a0', '').replaceAll(' ', '');
  const normalized = locale.startsWith('tr')
    ? trimmed.replaceAll('.', '').replace(',', '.')
    : trimmed.replaceAll(',', '');

  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    throw new Error('INVALID_AMOUNT');
  }

  const value = new Decimal(normalized);
  if (!value.isFinite() || value.lte(0)) throw new Error('INVALID_AMOUNT');

  return { amount: value.toString(), currency: currency.toUpperCase() };
}

export function convertMoney(
  money: Money,
  targetCurrency: CurrencyCode,
  snapshot: FxRateSnapshot,
): Money {
  const sourceRate = snapshot.rates[money.currency];
  const targetRate = snapshot.rates[targetCurrency];
  if (!sourceRate || !targetRate) throw new Error('FX_RATE_UNAVAILABLE');

  const baseAmount = new Decimal(money.amount).div(sourceRate);
  const targetMinorUnits = currencyDefinition(targetCurrency, 'en-US').minorUnits;
  const converted = baseAmount
    .mul(targetRate)
    .toDecimalPlaces(targetMinorUnits, Decimal.ROUND_HALF_EVEN);

  return { amount: converted.toString(), currency: targetCurrency };
}

export function formatMoney(money: Money, locale: string): string {
  const definition = currencyDefinition(money.currency, locale);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: definition.minorUnits,
    maximumFractionDigits: definition.minorUnits,
  }).format(new Decimal(money.amount).toNumber());
}

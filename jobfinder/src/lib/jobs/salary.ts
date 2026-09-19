import type { SalaryPeriod } from '@/types';

const PERIOD_MULTIPLIER: Record<SalaryPeriod, number> = {
  hourly: 2080,   // 40h x 52w
  daily: 260,
  weekly: 52,
  monthly: 12,
  yearly: 1,
};

/** Converts a figure to a yearly equivalent so salaries can be compared. */
export function toAnnual(amount: number | null, period: SalaryPeriod | null): number | null {
  if (amount == null || period == null) return null;
  return Math.round(amount * PERIOD_MULTIPLIER[period]);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  '$': 'USD', '€': 'EUR', '£': 'GBP', '₱': 'PHP', '₹': 'INR', '¥': 'JPY', 'C$': 'CAD', 'A$': 'AUD',
};

export interface ParsedSalary {
  min: number | null;
  max: number | null;
  currency: string | null;
  period: SalaryPeriod | null;
}

const EMPTY: ParsedSalary = { min: null, max: null, currency: null, period: null };

/**
 * Best-effort extraction from a free-text salary string, e.g.
 * "€90K – €160K", "$80,000-$100,000 per year", "25 USD/hour".
 *
 * Returns nulls rather than guessing. A missing salary is a valid state and
 * must not be fabricated — see docs/ARCHITECTURE.md.
 */
export function parseSalaryText(input: string | null | undefined): ParsedSalary {
  if (!input) return EMPTY;
  const text = input.replace(/\u00a0/g, ' ').replace(/[–—]/g, '-');

  // Currency: ISO code wins over symbol.
  let currency: string | null = null;
  const iso = text.match(/\b(USD|EUR|GBP|CAD|AUD|PHP|INR|SGD|JPY|CHF|SEK|NOK|DKK|PLN|BRL|MXN|ZAR)\b/i);
  if (iso) {
    currency = iso[1].toUpperCase();
  } else {
    for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
      if (text.includes(symbol)) { currency = code; break; }
    }
  }

  let period: SalaryPeriod | null = null;
  if (/\b(per hour|\/ ?hour|hourly|\/ ?hr|an hour)\b/i.test(text)) period = 'hourly';
  else if (/\b(per day|daily|\/ ?day)\b/i.test(text)) period = 'daily';
  else if (/\b(per week|weekly|\/ ?week)\b/i.test(text)) period = 'weekly';
  else if (/\b(per month|monthly|\/ ?month|p\.?m\.?)\b/i.test(text)) period = 'monthly';
  else if (/\b(per year|per annum|annually|yearly|\/ ?year|p\.?a\.?)\b/i.test(text)) period = 'yearly';

  // Numbers, with optional K/M suffix.
  const numbers: number[] = [];
  const re = /(\d[\d.,]*)\s*([kKmM])?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const rawDigits = m[1];
    // "90.000" (European thousands) vs "90.5" (decimal)
    const normalized = /^\d{1,3}([.,]\d{3})+$/.test(rawDigits)
      ? rawDigits.replace(/[.,]/g, '')
      : rawDigits.replace(/,/g, '');
    let value = Number(normalized);
    if (!Number.isFinite(value) || value <= 0) continue;
    const suffix = m[2]?.toLowerCase();
    if (suffix === 'k') value *= 1_000;
    if (suffix === 'm') value *= 1_000_000;
    numbers.push(value);
  }

  const amounts = numbers.filter((n) => n >= 1 && n <= 100_000_000);
  if (amounts.length === 0) return { ...EMPTY, currency, period };

  const min = amounts[0];
  const max = amounts.length > 1 ? Math.max(...amounts.slice(0, 2)) : null;

  // Infer period from magnitude only when the text gave no hint at all.
  let resolvedPeriod = period;
  if (!resolvedPeriod) {
    if (min < 500) resolvedPeriod = 'hourly';
    else if (min >= 10_000) resolvedPeriod = 'yearly';
  }

  return {
    min,
    max: max && max > min ? max : null,
    currency,
    period: resolvedPeriod,
  };
}

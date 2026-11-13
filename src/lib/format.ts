import type { ProjectStatus } from '../api/types.ts';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const usdCompactWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat('en-US');
const relative = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

export const formatUsd = (n: number) => usd.format(n);
/** $58K, $768K, $1.3M: whole thousands, one decimal for millions. */
export const formatUsdCompact = (n: number) =>
  (Math.abs(n) >= 1_000_000 ? usdCompact : usdCompactWhole).format(n);
export const formatNumber = (n: number) => number.format(n);

/** Dates from the API are either "YYYY-MM-DD" (local calendar days) or full ISO timestamps. */
const toDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);

export function formatDate(iso: string, withYear = false) {
  return toDate(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

export function formatTime(iso: string) {
  return toDate(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

export function formatRelative(iso: string) {
  const seconds = (toDate(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

/** Calendar days from a to b. */
export const daysBetween = (a: string, b: string) =>
  Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((toDate(iso).getTime() - today.getTime()) / 86_400_000);
}

export function scheduleText(daysLate: number) {
  if (daysLate > 0) return `${daysLate} day${daysLate === 1 ? '' : 's'} late`;
  if (daysLate < 0) return `${-daysLate} day${daysLate === -1 ? '' : 's'} early`;
  return 'On schedule';
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  'on-track': 'On track',
  'at-risk': 'At risk',
  delayed: 'Delayed',
  'on-hold': 'On hold',
  completed: 'Completed',
};

export const STATUS_ORDER: ProjectStatus[] = [
  'delayed',
  'at-risk',
  'on-hold',
  'on-track',
  'completed',
];

export const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

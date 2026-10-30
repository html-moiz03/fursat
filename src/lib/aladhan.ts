import type { Anchor } from '../types';
import { formatDate } from './time';

export const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export type PrayerName = (typeof PRAYERS)[number];

/** Start time of each prayer, in minutes since midnight. */
export type DayTimings = Record<PrayerName, number>;

export type MonthRequest = {
  year: number;
  /** 1-12 */
  month: number;
  city: string;
  country: string;
  method: number;
  school: 0 | 1;
};

const BASE = 'https://api.aladhan.com/v1';
export const PRAYER_COLOR = '#8a7240';

/** URL for one calendar month of prayer times in a city. */
export function monthUrl(r: MonthRequest): string {
  const q = new URLSearchParams({
    city: r.city.trim(),
    country: r.country.trim(),
    method: String(r.method),
    school: String(r.school),
  });
  return `${BASE}/calendarByCity/${r.year}/${r.month}?${q.toString()}`;
}

/** '05:12', '05:12 (PKT)' -> 312. Anything without an HH:MM in it -> null. */
export function parseTime(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const m = /(\d{1,2}):(\d{2})/.exec(value);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/** '02-11-2026' (DD-MM-YYYY) -> '2026-11-02', otherwise null. */
function dayMonthYear(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/**
 * Reads a calendarByCity response into timings per date ('YYYY-MM-DD').
 * Days come back in order, so if a day's date field is missing or unreadable its
 * position in the month is used instead. Throws an Error with a readable message
 * when the response is an error or holds no usable days.
 */
export function parseMonth(json: unknown, year: number, month: number): Record<string, DayTimings> {
  if (!isObject(json)) throw new Error('Unexpected response from the prayer-times service.');
  if (json.code !== 200 || !Array.isArray(json.data)) {
    const detail = typeof json.data === 'string' ? json.data : 'Unexpected response from the prayer-times service.';
    throw new Error(detail);
  }

  const days: Record<string, DayTimings> = {};
  json.data.forEach((entry: unknown, i: number) => {
    if (!isObject(entry) || !isObject(entry.timings)) return;

    const timings = {} as DayTimings;
    for (const name of PRAYERS) {
      const minutes = parseTime(entry.timings[name]);
      if (minutes === null) return;
      timings[name] = minutes;
    }

    const date = isObject(entry.date) ? entry.date : {};
    const gregorian = isObject(date.gregorian) ? date.gregorian : {};
    const key =
      dayMonthYear(gregorian.date) ?? dayMonthYear(date.readable) ?? formatDate(new Date(year, month - 1, i + 1));
    days[key] = timings;
  });

  if (Object.keys(days).length === 0) throw new Error('The service returned no prayer times for that place.');
  return days;
}

/** Fetches and reads one month. `fetchImpl` is injectable so tests need no network. */
export async function fetchMonth(
  request: MonthRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, DayTimings>> {
  let res: Response;
  try {
    res = await fetchImpl(monthUrl(request));
  } catch {
    throw new Error("Couldn't reach the prayer-times service. Check your connection.");
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error('Unexpected response from the prayer-times service.');
  }
  if (!res.ok && !(isObject(json) && typeof json.data === 'string')) {
    throw new Error(`The prayer-times service answered with an error (${res.status}).`);
  }
  return parseMonth(json, request.year, request.month);
}

/** One-off anchors, one per prayer per day, each blocking `durationMin` from the prayer time. */
export function prayerAnchors(days: Record<string, DayTimings>, durationMin: number): Anchor[] {
  return Object.entries(days).flatMap(([date, timings]) =>
    PRAYERS.map((name) => {
      const startMin = timings[name];
      return {
        id: `prayer-${date}-${name.toLowerCase()}`,
        title: name,
        startMin,
        endMin: Math.min(startMin + durationMin, 1439),
        repeatDays: [],
        date,
        kind: 'prayer' as const,
        source: 'prayer-api' as const,
        color: PRAYER_COLOR,
      };
    }),
  );
}

import { elapsedMs, type FocusSession } from './focus';
import { addDays, formatDuration } from './time';

/** One finished stretch of focus, kept for the "focused this week" totals. */
export type FocusEntry = {
  id: string;
  /** Local calendar day it ended on, YYYY-MM-DD. */
  date: string;
  title: string;
  /** Whole minutes actually spent, not the planned length. */
  minutes: number;
};

/** Sessions shorter than this are not worth logging (an accidental start). */
export const MIN_LOGGED_MS = 60_000;

/** How many entries are kept. Older ones fall off. */
export const LOG_LIMIT = 400;

/** The entry for a session that is ending at `now`, or null if too little time was spent. */
export function entryFor(session: FocusSession, now: number, date: string, id: string): FocusEntry | null {
  const spent = elapsedMs(session, now);
  if (spent < MIN_LOGGED_MS) return null;
  return { id, date, title: session.title ?? 'Task', minutes: Math.round(spent / 60_000) };
}

/** Minutes focused on each of `dates`, in the same order. */
export function dayTotals(log: FocusEntry[], dates: string[]): number[] {
  return dates.map((d) => log.reduce((sum, e) => (e.date === d ? sum + e.minutes : sum), 0));
}

/** '3h 20m', or '' for nothing, so callers can leave the line out. */
export function formatFocused(minutes: number): string {
  return minutes > 0 ? formatDuration(minutes) : '';
}

/** The last `count` dates ending on `today`, oldest first. */
export function lastDays(today: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(today, i - (count - 1)));
}

/**
 * Days in a row with some focus. Today not having any yet does not break the streak,
 * so it counts back from yesterday until today has some.
 */
export function streak(log: FocusEntry[], today: string): number {
  const days = new Set(log.map((e) => e.date));
  let date = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(date)) {
    n++;
    date = addDays(date, -1);
  }
  return n;
}

export type FocusDay = { date: string; minutes: number; entries: FocusEntry[] };

/** Entries grouped by day, newest day first. Within a day they keep the order they were logged, newest first. */
export function groupByDay(log: FocusEntry[]): FocusDay[] {
  const byDate = new Map<string, FocusEntry[]>();
  for (const e of [...log].reverse()) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, entries]) => ({ date, entries, minutes: entries.reduce((sum, e) => sum + e.minutes, 0) }));
}

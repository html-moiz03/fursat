import { elapsedMs, type FocusSession } from './focus';
import { formatDuration } from './time';

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

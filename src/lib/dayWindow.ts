import type { Anchor, Task } from '../types';
import { MINUTES_PER_DAY, fromMinutes } from './time';

/** Day hours move in half-hour steps. */
export const WINDOW_STEP = 30;
/** The shortest day window that makes sense. */
export const MIN_WINDOW = 60;

export type Window = { dayStartMin: number; dayEndMin: number };

/** 0, 30, ... 1440 */
export const WINDOW_OPTIONS: number[] = Array.from({ length: MINUTES_PER_DAY / WINDOW_STEP + 1 }, (_, i) => i * WINDOW_STEP);

/** '06:00', and '24:00' for the very end of the day (fromMinutes would wrap it to 00:00). */
export function timeLabel(min: number): string {
  return min >= MINUTES_PER_DAY ? '24:00' : fromMinutes(min);
}

export type WindowSuggestion = {
  dayStartMin: number;
  dayEndMin: number;
  /** Prayers that begin before the day does. */
  early: Anchor[];
  /** Prayers that end after the day does. */
  late: Anchor[];
};

/**
 * When a prayer on `date` falls outside the day window, the smallest half-hour-aligned
 * window that includes it. Null when every prayer already fits.
 */
export function suggestWindow(anchors: Anchor[], date: string, win: Window): WindowSuggestion | null {
  const prayers = anchors.filter((a) => a.source === 'prayer-api' && a.date === date);
  const early = prayers.filter((a) => a.startMin < win.dayStartMin);
  const late = prayers.filter((a) => a.endMin > win.dayEndMin);
  if (early.length === 0 && late.length === 0) return null;

  const dayStartMin =
    early.length > 0
      ? Math.floor(Math.min(...early.map((a) => a.startMin)) / WINDOW_STEP) * WINDOW_STEP
      : win.dayStartMin;
  const dayEndMin =
    late.length > 0
      ? Math.min(MINUTES_PER_DAY, Math.ceil(Math.max(...late.map((a) => a.endMin)) / WINDOW_STEP) * WINDOW_STEP)
      : win.dayEndMin;
  return { dayStartMin, dayEndMin, early, late };
}

/** Placed or finished tasks that are not entirely inside the window. */
export function tasksOutside(tasks: Task[], win: Window): Task[] {
  return tasks.filter(
    (t) =>
      t.status !== 'inbox' &&
      t.startMin !== undefined &&
      (t.startMin < win.dayStartMin || t.startMin + t.durationMin > win.dayEndMin),
  );
}

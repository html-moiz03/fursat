import type { Anchor, Gap, GapSettings, Interval } from '../types';
import { MINUTES_PER_DAY, addDays, weekdayOf } from './time';

function occursOn(anchor: Anchor, date: string): boolean {
  if (anchor.repeatDays.length > 0) {
    return anchor.repeatDays.includes(weekdayOf(date));
  }
  return anchor.date === date;
}

/**
 * The busy intervals of one calendar day, in minutes since midnight.
 *
 * - Handles repeating (weekday) and one-off (date) anchors.
 * - An anchor that crosses midnight is split: the first part lands on the day it
 *   starts, the rest spills into the next day.
 * - Zero-length anchors are ignored.
 */
export function anchorsForDate(anchors: Anchor[], date: string): Interval[] {
  const yesterday = addDays(date, -1);
  const intervals: Interval[] = [];

  for (const a of anchors) {
    if (a.endMin === a.startMin) continue;
    const crossesMidnight = a.endMin < a.startMin;

    if (occursOn(a, date)) {
      intervals.push(crossesMidnight ? [a.startMin, MINUTES_PER_DAY] : [a.startMin, a.endMin]);
    }
    // Spill-over from an anchor that started yesterday and ends today.
    if (crossesMidnight && occursOn(a, yesterday)) {
      intervals.push([0, a.endMin]);
    }
  }

  return intervals;
}

/**
 * Free gaps in the day window that no anchor covers.
 *
 * One sorted sweep: the cursor only moves forward, so overlapping anchors
 * collapse into a single busy stretch without a separate merge step.
 */
export function computeGaps(
  anchors: Anchor[],
  date: string,
  { dayStartMin, dayEndMin, minGapMin }: GapSettings,
): Gap[] {
  const intervals = anchorsForDate(anchors, date)
    .map(([s, e]): Interval => [Math.max(s, dayStartMin), Math.min(e, dayEndMin)])
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);

  const raw: Array<{ startMin: number; endMin: number }> = [];
  let cursor = dayStartMin;

  for (const [s, e] of intervals) {
    if (s > cursor) raw.push({ startMin: cursor, endMin: s });
    cursor = Math.max(cursor, e);
  }
  if (cursor < dayEndMin) raw.push({ startMin: cursor, endMin: dayEndMin });

  return raw
    .map((g) => ({ ...g, lengthMin: g.endMin - g.startMin, date }))
    .filter((g) => g.lengthMin >= minGapMin);
}

import type { Anchor, GapSettings, Task } from '../types';
import { computeGaps } from './gaps';

/** A stretch of one day, in minutes since midnight. */
export type Range = { startMin: number; endMin: number };

export type FitResult =
  | { fits: true; startMin: number }
  | { fits: false; shortfallMin: number };

/** Time taken on `date` by tasks that are planned or done (inbox tasks take no time). */
export function placedOn(tasks: Task[], date: string, excludeId?: string): Range[] {
  return tasks.flatMap((t) =>
    t.id !== excludeId && t.status !== 'inbox' && t.date === date && t.startMin !== undefined
      ? [{ startMin: t.startMin, endMin: t.startMin + t.durationMin }]
      : [],
  );
}

/**
 * What is left of a gap after the placed tasks are taken out.
 *
 * Same sorted sweep as computeGaps: the cursor only moves forward, so tasks
 * given out of order, or overlapping, need no special handling.
 */
export function freeRanges(gap: Range, placed: Range[]): Range[] {
  const taken = placed
    .map((p): Range => ({
      startMin: Math.max(p.startMin, gap.startMin),
      endMin: Math.min(p.endMin, gap.endMin),
    }))
    .filter((p) => p.endMin > p.startMin)
    .sort((a, b) => a.startMin - b.startMin);

  const free: Range[] = [];
  let cursor = gap.startMin;

  for (const p of taken) {
    if (p.startMin > cursor) free.push({ startMin: cursor, endMin: p.startMin });
    cursor = Math.max(cursor, p.endMin);
  }
  if (cursor < gap.endMin) free.push({ startMin: cursor, endMin: gap.endMin });

  return free;
}

/** Length in minutes of the longest unbroken stretch left in a gap. */
export function largestRoom(gap: Range, placed: Range[]): number {
  return Math.max(0, ...freeRanges(gap, placed).map((r) => r.endMin - r.startMin));
}

/**
 * Can a task of `durationMin` go in this gap? If so, where (earliest start that
 * fits). If not, by how many minutes it falls short of the longest free stretch.
 *
 * Fragmentation counts: two 60-minute holes do not fit a 90-minute task even
 * though 120 minutes are free in total.
 */
export function checkFit(durationMin: number, gap: Range, placed: Range[]): FitResult {
  const rooms = freeRanges(gap, placed);
  const room = rooms.find((r) => r.endMin - r.startMin >= durationMin);
  if (room) return { fits: true, startMin: room.startMin };

  const largest = Math.max(0, ...rooms.map((r) => r.endMin - r.startMin));
  return { fits: false, shortfallMin: durationMin - largest };
}

/**
 * True when a planned task no longer sits entirely inside free time, for example
 * after an anchor was added or edited underneath it. Inbox tasks never conflict.
 */
export function hasConflict(task: Task, anchors: Anchor[], settings: GapSettings): boolean {
  if (task.date === undefined || task.startMin === undefined) return false;

  const start = task.startMin;
  const end = start + task.durationMin;
  // minGapMin is 0 here: a task may legitimately sit in a gap the UI would hide.
  const gaps = computeGaps(anchors, task.date, { ...settings, minGapMin: 0 });

  return !gaps.some((g) => g.startMin <= start && end <= g.endMin);
}

/**
 * Earliest start for a task of `durationMin` anywhere in `gaps`, at or after `fromMin`,
 * with `placed` time taken out. Null when it fits nowhere.
 */
export function earliestSlot(durationMin: number, gaps: Range[], placed: Range[], fromMin = 0): number | null {
  for (const g of gaps) {
    const gap: Range = { startMin: Math.max(g.startMin, fromMin), endMin: g.endMin };
    if (gap.endMin <= gap.startMin) continue;
    const verdict = checkFit(durationMin, gap, placed);
    if (verdict.fits) return verdict.startMin;
  }
  return null;
}

/**
 * Earliest fit for a task at or after `fromMin`, inside the gap that contains `fromMin`.
 * Returns null when `fromMin` is not inside any gap. Passing a gap's own start asks about the whole gap.
 */
export function fitFrom(durationMin: number, gaps: Range[], fromMin: number, placed: Range[]): FitResult | null {
  const gap = gaps.find((g) => g.startMin <= fromMin && fromMin < g.endMin);
  if (!gap) return null;
  return checkFit(durationMin, { startMin: fromMin, endMin: gap.endMin }, placed);
}

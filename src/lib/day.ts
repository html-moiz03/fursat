import type { Anchor, GapSettings, Task } from '../types';
import { freeRanges, placedOn, type Range } from './fit';
import { anchorsForDate, computeGaps } from './gaps';

/** Free time on a day once placed tasks are taken out of the gaps. */
export function freeZonesFor(anchors: Anchor[], tasks: Task[], date: string, settings: GapSettings): Range[] {
  const placed = placedOn(tasks, date);
  return computeGaps(anchors, date, settings)
    .flatMap((g) => freeRanges(g, placed))
    .filter((z) => z.endMin - z.startMin >= settings.minGapMin);
}

export type UpNextItem = {
  id: string;
  kind: 'anchor' | 'task';
  title: string;
  startMin: number;
  endMin: number;
  color: string;
};

export const TASK_COLOR = '#0284c7';

/**
 * Anchors and not-yet-done tasks on `date` that have not finished by `fromMin`,
 * earliest first. Something already under way is included, so the caller can
 * tell it apart with `startMin <= fromMin`.
 */
export function upNext(anchors: Anchor[], tasks: Task[], date: string, fromMin: number, limit = 2): UpNextItem[] {
  const items: UpNextItem[] = [];

  for (const anchor of anchors) {
    for (const [startMin, endMin] of anchorsForDate([anchor], date)) {
      items.push({ id: `${anchor.id}-${startMin}`, kind: 'anchor', title: anchor.title, startMin, endMin, color: anchor.color });
    }
  }
  for (const t of tasks) {
    if (t.status !== 'planned' || t.date !== date || t.startMin === undefined) continue;
    items.push({ id: t.id, kind: 'task', title: t.title, startMin: t.startMin, endMin: t.startMin + t.durationMin, color: TASK_COLOR });
  }

  return items
    .filter((i) => i.endMin > fromMin)
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
    .slice(0, limit);
}

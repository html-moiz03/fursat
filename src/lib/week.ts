import type { Anchor, GapSettings, Task } from '../types';
import { TASK_COLOR, freeZonesFor } from './day';
import { anchorsForDate } from './gaps';
import { addDays, weekdayOf } from './time';

/** The Monday of the week that contains `date`. */
export function weekStart(date: string): string {
  return addDays(date, -((weekdayOf(date) + 6) % 7));
}

/** Seven dates, Monday first. */
export function weekDates(date: string): string[] {
  const first = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

export type DayItem = {
  id: string;
  kind: 'anchor' | 'task';
  title: string;
  startMin: number;
  endMin: number;
  color: string;
  done: boolean;
};

export type DayOverview = {
  date: string;
  items: DayItem[];
  /** Free time left in the day hours once anchors and placed tasks are taken out. */
  freeMin: number;
  /** Minutes taken by placed tasks. */
  plannedMin: number;
};

/** Everything one column of the week view needs, clipped to the day hours. */
export function dayOverview(anchors: Anchor[], tasks: Task[], date: string, settings: GapSettings): DayOverview {
  const { dayStartMin, dayEndMin } = settings;
  const items: DayItem[] = [];

  for (const anchor of anchors) {
    for (const [s, e] of anchorsForDate([anchor], date)) {
      const startMin = Math.max(s, dayStartMin);
      const endMin = Math.min(e, dayEndMin);
      if (endMin > startMin) {
        items.push({ id: `${anchor.id}-${s}`, kind: 'anchor', title: anchor.title, startMin, endMin, color: anchor.color, done: false });
      }
    }
  }

  let plannedMin = 0;
  for (const t of tasks) {
    if (t.status === 'inbox' || t.date !== date || t.startMin === undefined) continue;
    plannedMin += t.durationMin;
    const startMin = Math.max(t.startMin, dayStartMin);
    const endMin = Math.min(t.startMin + t.durationMin, dayEndMin);
    if (endMin > startMin) {
      items.push({ id: t.id, kind: 'task', title: t.title, startMin, endMin, color: TASK_COLOR, done: t.status === 'done' });
    }
  }

  items.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const freeMin = freeZonesFor(anchors, tasks, date, settings).reduce((sum, z) => sum + (z.endMin - z.startMin), 0);

  return { date, items, freeMin, plannedMin };
}

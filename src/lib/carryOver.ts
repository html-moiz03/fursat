import type { Anchor, GapSettings, Task } from '../types';
import { checkFit, placedOn, type Range } from './fit';
import { computeGaps } from './gaps';

/** Tasks that were planned for a day before `today` and never ticked off, oldest first. */
export function overdueTasks(tasks: Task[], today: string): Task[] {
  return tasks
    .filter((t) => t.status === 'planned' && t.date !== undefined && t.date < today)
    .sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : (a.startMin ?? 0) - (b.startMin ?? 0)));
}

export type CarryPlan = {
  /** Where each carried task lands today. */
  moved: { id: string; startMin: number }[];
  /** Tasks that found no room left today and go back to the inbox. */
  toInbox: string[];
};

/**
 * Plan for putting overdue tasks into what is left of today, oldest first, each at the
 * earliest free time at or after `fromMin`. A task that fits nowhere goes to the inbox
 * instead of being squeezed in. Tasks already placed today are respected.
 */
export function planCarryOver(
  tasks: Task[],
  anchors: Anchor[],
  today: string,
  fromMin: number,
  settings: GapSettings,
): CarryPlan {
  const overdue = overdueTasks(tasks, today);
  const placed: Range[] = placedOn(tasks, today);
  const gaps = computeGaps(anchors, today, { ...settings, minGapMin: 0 })
    .map((g): Range => ({ startMin: Math.max(g.startMin, fromMin), endMin: g.endMin }))
    .filter((g) => g.endMin > g.startMin);

  const plan: CarryPlan = { moved: [], toInbox: [] };

  for (const task of overdue) {
    let spot: number | null = null;
    for (const gap of gaps) {
      const verdict = checkFit(task.durationMin, gap, placed);
      if (verdict.fits) {
        spot = verdict.startMin;
        break;
      }
    }
    if (spot === null) {
      plan.toInbox.push(task.id);
    } else {
      plan.moved.push({ id: task.id, startMin: spot });
      placed.push({ startMin: spot, endMin: spot + task.durationMin });
    }
  }

  return plan;
}

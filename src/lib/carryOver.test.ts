import { describe, expect, it } from 'vitest';
import type { Anchor, Task } from '../types';
import { overdueTasks, planCarryOver } from './carryOver';

const settings = { dayStartMin: 360, dayEndMin: 1380, minGapMin: 10 };
const TODAY = '2026-11-02'; // Monday

const work: Anchor = {
  id: 'w', title: 'Work', startMin: 540, endMin: 1020, repeatDays: [1],
  kind: 'work', source: 'manual', color: '#111',
};

const task = (id: string, over: Partial<Task> = {}): Task => ({
  id, title: id, durationMin: 60, status: 'planned', date: '2026-10-30', startMin: 600, createdAt: 0, ...over,
});

describe('overdueTasks', () => {
  it('returns only planned tasks from earlier days, oldest first', () => {
    const tasks = [
      task('new', { date: '2026-11-01' }),
      task('old', { date: '2026-10-28' }),
      task('done', { status: 'done' }),
      task('today', { date: TODAY }),
      task('later', { date: '2026-11-05' }),
      task('inbox', { status: 'inbox', date: undefined, startMin: undefined }),
    ];
    expect(overdueTasks(tasks, TODAY).map((t) => t.id)).toEqual(['old', 'new']);
  });
});

describe('planCarryOver', () => {
  it('places tasks one after another from the earliest free time', () => {
    const plan = planCarryOver([task('a'), task('b')], [], TODAY, 600, settings);
    expect(plan.moved).toEqual([{ id: 'a', startMin: 600 }, { id: 'b', startMin: 660 }]);
    expect(plan.toInbox).toEqual([]);
  });

  it('skips over anchors and tasks already placed today', () => {
    const tasks = [task('a'), task('placed', { date: TODAY, startMin: 1020 })];
    const plan = planCarryOver(tasks, [work], TODAY, 600, settings);
    expect(plan.moved).toEqual([{ id: 'a', startMin: 1080 }]); // after Work and the placed task
  });

  it('sends a task to the inbox when nothing is left today', () => {
    const plan = planCarryOver([task('a')], [], TODAY, 1350, settings); // 30 min left
    expect(plan.moved).toEqual([]);
    expect(plan.toInbox).toEqual(['a']);
  });

  it('keeps a long task out of a hole that is too short but still places a short one', () => {
    const tasks = [task('long', { durationMin: 120 }), task('short', { durationMin: 30, date: '2026-10-31' })];
    const plan = planCarryOver(tasks, [work], TODAY, 480, settings); // only 08:00-09:00 before Work
    // Oldest first: 'long' skips the 60-minute hole and lands after Work; 'short' takes the hole.
    expect(plan.moved).toEqual([{ id: 'long', startMin: 1020 }, { id: 'short', startMin: 480 }]);
    expect(plan.toInbox).toEqual([]);
  });
});

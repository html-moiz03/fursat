import { describe, expect, it } from 'vitest';
import type { Anchor, Task } from '../types';
import { dayOverview, firstStart, slotOnDay, weekDates, weekStart } from './week';

const settings = { dayStartMin: 360, dayEndMin: 1380, minGapMin: 10 };

const work: Anchor = {
  id: 'w', title: 'Work', startMin: 540, endMin: 1020, repeatDays: [1, 2, 3, 4, 5],
  kind: 'work', source: 'manual', color: '#111',
};

const task = (over: Partial<Task>): Task => ({
  id: 't', title: 'Read', durationMin: 60, status: 'planned', date: '2026-11-02', startMin: 360, createdAt: 0, ...over,
});

describe('weekStart / weekDates', () => {
  it('finds the Monday for any day of the week', () => {
    expect(weekStart('2026-11-02')).toBe('2026-11-02'); // Monday
    expect(weekStart('2026-11-04')).toBe('2026-11-02'); // Wednesday
    expect(weekStart('2026-11-08')).toBe('2026-11-02'); // Sunday belongs to the week before it
  });

  it('lists seven days across a month boundary', () => {
    expect(weekDates('2026-10-29')).toEqual([
      '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01',
    ]);
  });
});

describe('dayOverview', () => {
  it('lists anchors and tasks in time order with free time left', () => {
    const o = dayOverview([work], [task({})], '2026-11-02', settings);
    expect(o.items.map((i) => i.title)).toEqual(['Read', 'Work']);
    expect(o.plannedMin).toBe(60);
    // 06:00-09:00 minus the 60-minute task, plus 17:00-23:00
    expect(o.freeMin).toBe(120 + 360);
  });

  it('ignores inbox tasks and tasks on other days', () => {
    const o = dayOverview([work], [task({ status: 'inbox', date: undefined, startMin: undefined }), task({ id: 'x', date: '2026-11-03' })], '2026-11-02', settings);
    expect(o.items.map((i) => i.title)).toEqual(['Work']);
    expect(o.plannedMin).toBe(0);
  });

  it('shows a weekend as fully free', () => {
    const o = dayOverview([work], [], '2026-11-07', settings);
    expect(o.items).toEqual([]);
    expect(o.freeMin).toBe(1020);
  });

  it('clips items to the day hours and marks done tasks', () => {
    const o = dayOverview([], [task({ status: 'done', startMin: 330 })], '2026-11-02', settings);
    expect(o.items[0]).toMatchObject({ startMin: 360, endMin: 390, done: true });
  });
});

describe('firstStart', () => {
  it('is the day start for other days and the next 5 minutes for today', () => {
    expect(firstStart('2026-11-03', '2026-11-02', 700, 360)).toBe(360);
    expect(firstStart('2026-11-02', '2026-11-02', 701, 360)).toBe(705);
    expect(firstStart('2026-11-02', '2026-11-02', 100, 360)).toBe(360);
  });
});

describe('slotOnDay', () => {
  it('finds the earliest free time that fits, skipping anchors', () => {
    const t = task({ id: 'x', durationMin: 120, date: undefined, startMin: undefined, status: 'inbox' });
    // Monday: 06:00-09:00 is free and fits 2h
    expect(slotOnDay(t, [work], [], '2026-11-02', 360, settings)).toBe(360);
    // from 08:00 only 1h is left before Work, so it lands after Work
    expect(slotOnDay(t, [work], [], '2026-11-02', 480, settings)).toBe(1020);
  });

  it('ignores the task\'s own current slot', () => {
    const t = task({ durationMin: 180, startMin: 360 }); // fills 06:00-09:00 exactly
    expect(slotOnDay(t, [work], [t], '2026-11-02', 360, settings)).toBe(360);
  });

  it('returns null when the day has no room', () => {
    const t = task({ durationMin: 60, date: undefined, startMin: undefined, status: 'inbox' });
    expect(slotOnDay(t, [work], [], '2026-11-02', 1350, settings)).toBeNull();
  });
});

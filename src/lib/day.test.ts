import { describe, expect, it } from 'vitest';
import type { Anchor, Task } from '../types';
import { monthGrid, shiftMonth } from './calendar';
import { freeZonesFor, upNext } from './day';

const MON = '2026-11-02'; // a Monday
const settings = { dayStartMin: 360, dayEndMin: 1380, minGapMin: 10 };

const work: Anchor = {
  id: 'work', title: 'Work', startMin: 540, endMin: 1020,
  repeatDays: [1, 2, 3, 4, 5], kind: 'work', source: 'manual', color: '#111',
};
const gym: Anchor = {
  id: 'gym', title: 'Gym', startMin: 420, endMin: 480,
  repeatDays: [], date: MON, kind: 'other', source: 'manual', color: '#222',
};
const task = (over: Partial<Task>): Task => ({
  id: 't', title: 'Study', durationMin: 60, status: 'planned', date: MON, startMin: 600, createdAt: 0, ...over,
});

describe('freeZonesFor', () => {
  it('takes placed tasks out of the gaps', () => {
    const zones = freeZonesFor([work], [task({ startMin: 360, durationMin: 60 })], MON, settings);
    expect(zones[0]).toEqual({ startMin: 420, endMin: 540 });
  });
});

describe('upNext', () => {
  it('lists the next items in time order, anchors and tasks together', () => {
    const items = upNext([work, gym], [task({ startMin: 1080 })], MON, 400);
    expect(items.map((i) => i.title)).toEqual(['Gym', 'Work']);
  });

  it('includes something already under way and skips what has finished', () => {
    const items = upNext([work, gym], [], MON, 450);
    expect(items[0].title).toBe('Gym');
    expect(items[0].startMin <= 450).toBe(true);
    expect(upNext([work, gym], [], MON, 500).map((i) => i.title)).toEqual(['Work']);
  });

  it('ignores done tasks, inbox tasks and other days', () => {
    const tasks = [task({ id: 'a', status: 'done' }), task({ id: 'b', status: 'inbox', date: undefined, startMin: undefined }), task({ id: 'c', date: '2026-11-03' })];
    expect(upNext([], tasks, MON, 0)).toEqual([]);
  });

  it('respects the limit', () => {
    expect(upNext([work, gym], [task({})], MON, 0, 2)).toHaveLength(2);
  });
});

describe('monthGrid', () => {
  it('starts on the Monday on or before the 1st and has 42 days', () => {
    const grid = monthGrid(2026, 10); // November 2026, the 1st is a Sunday
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-10-26');
    expect(grid[6]).toBe('2026-11-01');
  });

  it('puts a month that starts on Monday in the first cell', () => {
    expect(monthGrid(2026, 5)[0]).toBe('2026-06-01'); // 1 June 2026 is a Monday
  });
});

describe('shiftMonth', () => {
  it('moves across year boundaries', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
});

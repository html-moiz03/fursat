import { describe, expect, it } from 'vitest';
import type { Anchor, Task } from '../types';
import { checkFit, fitFrom, freeRanges, hasConflict, largestRoom, maxDuration, placedOn, snapDuration } from './fit';

const MON = '2026-11-02'; // a Monday
const TUE = '2026-11-03';

const r = (startMin: number, endMin: number) => ({ startMin, endMin });

function task(partial: Partial<Task> = {}): Task {
  return {
    id: 't',
    title: 'Task',
    durationMin: 30,
    status: 'inbox',
    createdAt: 0,
    ...partial,
  };
}

function planned(startMin: number, durationMin: number, partial: Partial<Task> = {}): Task {
  return task({ status: 'planned', date: MON, startMin, durationMin, ...partial });
}

describe('freeRanges', () => {
  const gap = r(540, 720);

  it('returns the whole gap when nothing is placed', () => {
    expect(freeRanges(gap, [])).toEqual([gap]);
  });

  it('splits the gap around a task in the middle', () => {
    expect(freeRanges(gap, [r(600, 630)])).toEqual([r(540, 600), r(630, 720)]);
  });

  it('trims a task at the start of the gap', () => {
    expect(freeRanges(gap, [r(540, 570)])).toEqual([r(570, 720)]);
  });

  it('trims a task at the end of the gap', () => {
    expect(freeRanges(gap, [r(690, 720)])).toEqual([r(540, 690)]);
  });

  it('handles tasks given out of order', () => {
    expect(freeRanges(gap, [r(660, 690), r(560, 600)])).toEqual([r(540, 560), r(600, 660), r(690, 720)]);
  });

  it('handles overlapping tasks without double-counting', () => {
    expect(freeRanges(gap, [r(560, 620), r(600, 650)])).toEqual([r(540, 560), r(650, 720)]);
  });

  it('ignores tasks outside the gap', () => {
    expect(freeRanges(gap, [r(0, 60), r(800, 900)])).toEqual([gap]);
  });

  it('clamps a task that sticks out of the gap', () => {
    expect(freeRanges(gap, [r(500, 560)])).toEqual([r(560, 720)]);
  });

  it('returns nothing when the gap is completely taken', () => {
    expect(freeRanges(gap, [r(500, 800)])).toEqual([]);
  });

  it('leaves no zero-length range between back-to-back tasks', () => {
    expect(freeRanges(gap, [r(540, 600), r(600, 660)])).toEqual([r(660, 720)]);
  });
});

describe('largestRoom', () => {
  it('is the longest unbroken stretch', () => {
    expect(largestRoom(r(540, 720), [r(560, 600)])).toBe(120); // 20 min and 120 min
  });

  it('is 0 when the gap is full', () => {
    expect(largestRoom(r(540, 720), [r(540, 720)])).toBe(0);
  });
});

describe('checkFit', () => {
  it('fits at the start of an empty gap', () => {
    expect(checkFit(60, r(540, 720), [])).toEqual({ fits: true, startMin: 540 });
  });

  it('fits a task exactly as long as the gap', () => {
    expect(checkFit(180, r(540, 720), [])).toEqual({ fits: true, startMin: 540 });
  });

  it('skips a leftover that is too small and uses the next room', () => {
    // free: 540-560 (20 min) and 600-720 (120 min)
    expect(checkFit(60, r(540, 720), [r(560, 600)])).toEqual({ fits: true, startMin: 600 });
  });

  it('uses the earliest room that fits', () => {
    // free: 540-600 (60) and 660-720 (60)
    expect(checkFit(45, r(540, 720), [r(600, 660)])).toEqual({ fits: true, startMin: 540 });
  });

  it('reports the shortfall when the gap is too short', () => {
    expect(checkFit(90, r(540, 600), [])).toEqual({ fits: false, shortfallMin: 30 });
  });

  it('counts fragmentation: two 60-minute holes do not fit 90 minutes', () => {
    expect(checkFit(90, r(0, 180), [r(60, 120)])).toEqual({ fits: false, shortfallMin: 30 });
  });

  it('reports the full duration as the shortfall when the gap is full', () => {
    expect(checkFit(45, r(540, 600), [r(540, 600)])).toEqual({ fits: false, shortfallMin: 45 });
  });
});

describe('placedOn', () => {
  const tasks = [
    planned(540, 60, { id: 'a' }),
    planned(700, 30, { id: 'b', status: 'done' }),
    planned(800, 30, { id: 'c', date: TUE }),
    task({ id: 'd' }),
  ];

  it('includes planned and done tasks on that date only', () => {
    expect(placedOn(tasks, MON)).toEqual([r(540, 600), r(700, 730)]);
  });

  it('can leave one task out, so it can be moved without blocking itself', () => {
    expect(placedOn(tasks, MON, 'a')).toEqual([r(700, 730)]);
  });

  it('ignores inbox tasks', () => {
    expect(placedOn([task()], MON)).toEqual([]);
  });
});

describe('hasConflict', () => {
  const work: Anchor = {
    id: 'w',
    title: 'Work',
    startMin: 540,
    endMin: 1020,
    repeatDays: [1],
    kind: 'work',
    source: 'manual',
    color: '#888',
  };
  const settings = { dayStartMin: 360, dayEndMin: 1380, minGapMin: 10 };

  it('is false for a task inside free time', () => {
    expect(hasConflict(planned(1020, 60), [work], settings)).toBe(false);
  });

  it('is false for a task that ends exactly where an anchor starts', () => {
    expect(hasConflict(planned(480, 60), [work], settings)).toBe(false);
  });

  it('is true when an anchor now covers part of the task', () => {
    expect(hasConflict(planned(500, 60), [work], settings)).toBe(true);
  });

  it('is true when the task sits inside an anchor', () => {
    expect(hasConflict(planned(600, 30), [work], settings)).toBe(true);
  });

  it('is true when the task is outside the day window', () => {
    expect(hasConflict(planned(300, 30), [], settings)).toBe(true);
  });

  it('is false on a day the anchor does not repeat', () => {
    expect(hasConflict(planned(600, 30, { date: TUE }), [work], settings)).toBe(false);
  });

  it('is false for a task that sits in a gap shorter than the hidden-gap setting', () => {
    const tight = [{ ...work, startMin: 540, endMin: 600 }, { ...work, id: 'w2', startMin: 605, endMin: 700 }];
    expect(hasConflict(planned(600, 5), tight, settings)).toBe(false);
  });

  it('is false for an inbox task', () => {
    expect(hasConflict(task(), [work], settings)).toBe(false);
  });
});

describe('fitFrom', () => {
  const gaps = [
    { startMin: 360, endMin: 540 }, // 06:00-09:00
    { startMin: 1020, endMin: 1080 }, // 17:00-18:00
  ];

  it('treats a gap start as the whole gap', () => {
    expect(fitFrom(90, gaps, 360, [])).toEqual({ fits: true, startMin: 360 });
  });

  it('starts at the given minute when it sits inside a gap', () => {
    expect(fitFrom(60, gaps, 450, [])).toEqual({ fits: true, startMin: 450 });
  });

  it('only looks at the room from that minute to the end of the gap', () => {
    expect(fitFrom(90, gaps, 450, [])).toEqual({ fits: true, startMin: 450 }); // exactly 90 left
    expect(fitFrom(120, gaps, 450, [])).toEqual({ fits: false, shortfallMin: 30 });
  });

  it('works around tasks already placed after the start', () => {
    const placed = [{ startMin: 450, endMin: 480 }];
    expect(fitFrom(60, gaps, 360, placed)).toEqual({ fits: true, startMin: 360 });
    expect(fitFrom(120, gaps, 360, placed)).toEqual({ fits: false, shortfallMin: 30 });
  });

  it('returns null outside every gap', () => {
    expect(fitFrom(30, gaps, 700, [])).toBeNull();
    expect(fitFrom(30, gaps, 540, [])).toBeNull(); // the end of a gap is not inside it
  });
});

describe('maxDuration and snapDuration', () => {
  const gaps = [{ startMin: 540, endMin: 720 }];
  const task = (startMin: number, durationMin: number) =>
    ({ id: 'a', title: 'a', durationMin, status: 'planned', date: '2026-01-05', startMin, createdAt: 0 }) as const;

  it('lets a task grow to the end of its gap', () => {
    expect(maxDuration(task(600, 30), gaps, [])).toBe(120);
  });
  it('stops at the next placed task', () => {
    expect(maxDuration(task(600, 30), gaps, [{ startMin: 660, endMin: 700 }])).toBe(60);
  });
  it('is null for a task outside free time', () => {
    expect(maxDuration(task(800, 30), gaps, [])).toBeNull();
  });
  it('snaps to 5 minutes and keeps between 5 and the maximum', () => {
    expect(snapDuration(47, 120)).toBe(45);
    expect(snapDuration(-20, 120)).toBe(5);
    expect(snapDuration(500, 118)).toBe(115);
  });
});

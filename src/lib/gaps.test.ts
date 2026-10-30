import { describe, expect, it } from 'vitest';
import type { Anchor } from '../types';
import { computeGaps } from './gaps';
import { addDays, formatDuration, fromMinutes, toMinutes, weekdayOf } from './time';

// 2026-11-02 is a Monday, 2026-11-03 a Tuesday.
const MON = '2026-11-02';
const TUE = '2026-11-03';

const fullDay = { dayStartMin: 0, dayEndMin: 1440, minGapMin: 0 };

function anchor(partial: Partial<Anchor> & Pick<Anchor, 'startMin' | 'endMin'>): Anchor {
  return {
    id: 'a',
    title: 'Test',
    repeatDays: [1], // Monday
    kind: 'other',
    source: 'manual',
    color: '#888',
    ...partial,
  };
}

const range = (g: { startMin: number; endMin: number }) => [g.startMin, g.endMin];

describe('computeGaps', () => {
  it('returns the whole window when there are no anchors', () => {
    const gaps = computeGaps([], MON, { dayStartMin: 360, dayEndMin: 1380, minGapMin: 0 });
    expect(gaps.map(range)).toEqual([[360, 1380]]);
    expect(gaps[0].lengthMin).toBe(1020);
    expect(gaps[0].date).toBe(MON);
  });

  it('splits the day around a single anchor', () => {
    const gaps = computeGaps([anchor({ startMin: 540, endMin: 1020 })], MON, fullDay);
    expect(gaps.map(range)).toEqual([
      [0, 540],
      [1020, 1440],
    ]);
  });

  it('collapses overlapping anchors into one busy stretch', () => {
    const gaps = computeGaps(
      [anchor({ id: '1', startMin: 540, endMin: 720 }), anchor({ id: '2', startMin: 600, endMin: 780 })],
      MON,
      fullDay,
    );
    expect(gaps.map(range)).toEqual([
      [0, 540],
      [780, 1440],
    ]);
  });

  it('handles an anchor fully inside another one', () => {
    const gaps = computeGaps(
      [anchor({ id: '1', startMin: 540, endMin: 900 }), anchor({ id: '2', startMin: 600, endMin: 660 })],
      MON,
      fullDay,
    );
    expect(gaps.map(range)).toEqual([
      [0, 540],
      [900, 1440],
    ]);
  });

  it('creates no zero-length gap between back-to-back anchors', () => {
    const gaps = computeGaps(
      [anchor({ id: '1', startMin: 540, endMin: 600 }), anchor({ id: '2', startMin: 600, endMin: 660 })],
      MON,
      fullDay,
    );
    expect(gaps.map(range)).toEqual([
      [0, 540],
      [660, 1440],
    ]);
  });

  it('is not thrown off by anchors given out of order', () => {
    const gaps = computeGaps(
      [anchor({ id: '2', startMin: 900, endMin: 960 }), anchor({ id: '1', startMin: 300, endMin: 360 })],
      MON,
      fullDay,
    );
    expect(gaps.map(range)).toEqual([
      [0, 300],
      [360, 900],
      [960, 1440],
    ]);
  });

  describe('midnight crossing', () => {
    const night = anchor({ startMin: toMinutes('22:00'), endMin: toMinutes('02:00') });

    it('blocks the evening of the day it starts', () => {
      expect(computeGaps([night], MON, fullDay).map(range)).toEqual([[0, 1320]]);
    });

    it('blocks the early morning of the next day', () => {
      expect(computeGaps([night], TUE, fullDay).map(range)).toEqual([[120, 1440]]);
    });

    it('does not spill onto a day when the anchor did not run the night before', () => {
      // Repeats Monday only, so Wednesday is untouched.
      const wed = addDays(TUE, 1);
      expect(computeGaps([night], wed, fullDay).map(range)).toEqual([[0, 1440]]);
    });
  });

  describe('day window', () => {
    it('clamps an anchor that starts before the window', () => {
      const gaps = computeGaps([anchor({ startMin: 300, endMin: 420 })], MON, {
        dayStartMin: 360,
        dayEndMin: 1380,
        minGapMin: 0,
      });
      expect(gaps.map(range)).toEqual([[420, 1380]]);
    });

    it('drops an anchor that is entirely outside the window', () => {
      const gaps = computeGaps([anchor({ startMin: 60, endMin: 120 })], MON, {
        dayStartMin: 360,
        dayEndMin: 1380,
        minGapMin: 0,
      });
      expect(gaps.map(range)).toEqual([[360, 1380]]);
    });

    it('returns no gaps when one anchor covers the whole window', () => {
      const gaps = computeGaps([anchor({ startMin: 0, endMin: 1439 })], MON, {
        dayStartMin: 360,
        dayEndMin: 1380,
        minGapMin: 0,
      });
      expect(gaps).toEqual([]);
    });
  });

  describe('which anchors apply on a date', () => {
    it('ignores a repeating anchor on a weekday it does not repeat on', () => {
      const gaps = computeGaps([anchor({ startMin: 540, endMin: 600 })], TUE, fullDay);
      expect(gaps.map(range)).toEqual([[0, 1440]]);
    });

    it('applies a one-off anchor only on its own date', () => {
      const oneOff = anchor({ repeatDays: [], date: MON, startMin: 540, endMin: 600 });
      expect(computeGaps([oneOff], MON, fullDay).map(range)).toEqual([
        [0, 540],
        [600, 1440],
      ]);
      expect(computeGaps([oneOff], TUE, fullDay).map(range)).toEqual([[0, 1440]]);
    });

    it('ignores zero-length anchors', () => {
      const gaps = computeGaps([anchor({ startMin: 600, endMin: 600 })], MON, fullDay);
      expect(gaps.map(range)).toEqual([[0, 1440]]);
    });
  });

  describe('minimum gap', () => {
    it('hides gaps shorter than minGapMin', () => {
      const gaps = computeGaps(
        [anchor({ id: '1', startMin: 540, endMin: 600 }), anchor({ id: '2', startMin: 605, endMin: 660 })],
        MON,
        { dayStartMin: 540, dayEndMin: 720, minGapMin: 10 },
      );
      // The 5-minute gap (600-605) is hidden; 660-720 stays.
      expect(gaps.map(range)).toEqual([[660, 720]]);
    });

    it('keeps a gap exactly as long as minGapMin', () => {
      const gaps = computeGaps([anchor({ startMin: 540, endMin: 600 })], MON, {
        dayStartMin: 540,
        dayEndMin: 610,
        minGapMin: 10,
      });
      expect(gaps.map(range)).toEqual([[600, 610]]);
    });
  });
});

describe('time helpers', () => {
  it('converts between HH:MM and minutes', () => {
    expect(toMinutes('09:30')).toBe(570);
    expect(fromMinutes(570)).toBe('09:30');
    expect(fromMinutes(1440)).toBe('00:00');
  });

  it('formats durations', () => {
    expect(formatDuration(100)).toBe('1h 40m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(25)).toBe('25m');
  });

  it('reads weekdays and shifts dates as local calendar dates', () => {
    expect(weekdayOf(MON)).toBe(1);
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

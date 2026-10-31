import { describe, expect, it } from 'vitest';
import { pauseSession, startSession } from './focus';
import { dayTotals, entryFor, formatFocused, groupByDay, lastDays, streak } from './focusLog';

const T0 = 1_000_000;

describe('entryFor', () => {
  it('logs the time actually spent, in whole minutes', () => {
    const s = startSession('t', 25, T0, 'Write');
    expect(entryFor(s, T0 + 10 * 60_000 + 20_000, '2026-11-02', 'e1')).toEqual({ id: 'e1', date: '2026-11-02', title: 'Write', minutes: 10 });
  });
  it('counts a paused session only for the running time', () => {
    const s = pauseSession(startSession('t', 25, T0, 'Write'), T0 + 5 * 60_000);
    expect(entryFor(s, T0 + 60 * 60_000, '2026-11-02', 'e')?.minutes).toBe(5);
  });
  it('caps at the planned length', () => {
    expect(entryFor(startSession('t', 25, T0), T0 + 99 * 60_000, 'd', 'e')?.minutes).toBe(25);
  });
  it('skips an accidental start under a minute', () => {
    expect(entryFor(startSession('t', 25, T0), T0 + 30_000, 'd', 'e')).toBeNull();
  });
  it('falls back to a generic title', () => {
    expect(entryFor(startSession('t', 25, T0), T0 + 120_000, 'd', 'e')?.title).toBe('Task');
  });
});

describe('dayTotals and formatFocused', () => {
  const log = [
    { id: '1', date: '2026-11-02', title: 'a', minutes: 25 },
    { id: '2', date: '2026-11-02', title: 'b', minutes: 40 },
    { id: '3', date: '2026-11-04', title: 'c', minutes: 90 },
  ];
  it('sums per day in the order asked', () => {
    expect(dayTotals(log, ['2026-11-02', '2026-11-03', '2026-11-04'])).toEqual([65, 0, 90]);
  });
  it('formats, and leaves nothing for zero', () => {
    expect(formatFocused(200)).toBe('3h 20m');
    expect(formatFocused(45)).toBe('45m');
    expect(formatFocused(0)).toBe('');
  });
});

describe('lastDays, streak and groupByDay', () => {
  const e = (id: string, date: string, minutes = 10) => ({ id, date, title: id, minutes });

  it('lists the last days oldest first, ending today', () => {
    expect(lastDays('2026-11-03', 3)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
  });
  it('counts consecutive days, today included', () => {
    expect(streak([e('a', '2026-11-03'), e('b', '2026-11-02'), e('c', '2026-11-01')], '2026-11-03')).toBe(3);
  });
  it('does not break the streak just because today has none yet', () => {
    expect(streak([e('b', '2026-11-02'), e('c', '2026-11-01')], '2026-11-03')).toBe(2);
  });
  it('is zero after a gap of a day or more', () => {
    expect(streak([e('c', '2026-10-30')], '2026-11-03')).toBe(0);
    expect(streak([e('a', '2026-11-03'), e('c', '2026-11-01')], '2026-11-03')).toBe(1);
  });
  it('groups newest day first with totals, newest entry first', () => {
    const groups = groupByDay([e('a', '2026-11-01', 5), e('b', '2026-11-02', 20), e('c', '2026-11-02', 30)]);
    expect(groups.map((g) => [g.date, g.minutes])).toEqual([['2026-11-02', 50], ['2026-11-01', 5]]);
    expect(groups[0].entries.map((x) => x.id)).toEqual(['c', 'b']);
  });
});

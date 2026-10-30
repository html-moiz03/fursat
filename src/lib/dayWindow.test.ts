import { describe, expect, it } from 'vitest';
import type { Anchor, Task } from '../types';
import { WINDOW_OPTIONS, suggestWindow, tasksOutside, timeLabel } from './dayWindow';

const DATE = '2026-11-02';
const win = { dayStartMin: 360, dayEndMin: 1380 }; // 06:00-23:00

const prayer = (title: string, startMin: number, endMin = startMin + 20, date = DATE): Anchor => ({
  id: `p-${date}-${title}`, title, startMin, endMin, repeatDays: [], date,
  kind: 'prayer', source: 'prayer-api', color: '#8a7240',
});
const manual = (startMin: number, endMin: number): Anchor => ({
  id: 'm', title: 'Gym', startMin, endMin, repeatDays: [], date: DATE,
  kind: 'other', source: 'manual', color: '#222',
});
const task = (over: Partial<Task>): Task => ({
  id: 't', title: 'Study', durationMin: 60, status: 'planned', date: DATE, startMin: 600, createdAt: 0, ...over,
});

describe('WINDOW_OPTIONS and timeLabel', () => {
  it('runs from midnight to the end of the day in half hours', () => {
    expect(WINDOW_OPTIONS[0]).toBe(0);
    expect(WINDOW_OPTIONS[1]).toBe(30);
    expect(WINDOW_OPTIONS.at(-1)).toBe(1440);
    expect(WINDOW_OPTIONS).toHaveLength(49);
  });

  it('writes the end of the day as 24:00', () => {
    expect(timeLabel(1440)).toBe('24:00');
    expect(timeLabel(360)).toBe('06:00');
  });
});

describe('suggestWindow', () => {
  it('suggests an earlier start for an early Fajr, rounded down to the half hour', () => {
    const s = suggestWindow([prayer('Fajr', 279)], DATE, win)!; // 04:39
    expect(s.dayStartMin).toBe(270); // 04:30
    expect(s.dayEndMin).toBe(1380);
    expect(s.early.map((a) => a.title)).toEqual(['Fajr']);
    expect(s.late).toEqual([]);
  });

  it('suggests a later end for a late prayer, rounded up', () => {
    const s = suggestWindow([prayer('Isha', 1390)], DATE, win)!; // ends 23:30 -> 1410
    expect(s.dayEndMin).toBe(1410);
    expect(s.dayStartMin).toBe(360);
  });

  it('never goes past 24:00', () => {
    expect(suggestWindow([prayer('Isha', 1430, 1439)], DATE, win)!.dayEndMin).toBe(1440);
  });

  it('can move both ends at once', () => {
    const s = suggestWindow([prayer('Fajr', 200), prayer('Isha', 1400)], DATE, win)!;
    expect(s.dayStartMin).toBe(180);
    expect(s.dayEndMin).toBe(1440);
  });

  it('is null when every prayer already fits', () => {
    expect(suggestWindow([prayer('Fajr', 400), prayer('Isha', 1200)], DATE, win)).toBeNull();
  });

  it('ignores manual anchors, other days and a prayer that fits exactly at the edge', () => {
    expect(suggestWindow([manual(100, 200)], DATE, win)).toBeNull();
    expect(suggestWindow([prayer('Fajr', 100, 120, '2026-11-03')], DATE, win)).toBeNull();
    expect(suggestWindow([prayer('Fajr', 360)], DATE, win)).toBeNull();
  });
});

describe('tasksOutside', () => {
  it('finds tasks that start before or end after the window', () => {
    const tasks = [task({ id: 'a', startMin: 300 }), task({ id: 'b', startMin: 1350 }), task({ id: 'c', startMin: 600 })];
    expect(tasksOutside(tasks, win).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('ignores inbox tasks', () => {
    expect(tasksOutside([task({ status: 'inbox', startMin: undefined })], win)).toEqual([]);
  });

  it('counts done tasks too', () => {
    expect(tasksOutside([task({ status: 'done', startMin: 300 })], win)).toHaveLength(1);
  });
});

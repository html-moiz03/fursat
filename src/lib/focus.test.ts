import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import {
  elapsedMs, extendSession, finishSession, formatClock, isRunning, pauseSession, pickFocusTask,
  progress, remainingMs, resumeSession, startSession,
} from './focus';

const T0 = 1_000_000;
const MIN = 60_000;

describe('a running session', () => {
  const s = startSession('a', 25, T0);

  it('counts down from the task length', () => {
    expect(remainingMs(s, T0)).toBe(25 * MIN);
    expect(remainingMs(s, T0 + 5 * MIN)).toBe(20 * MIN);
    expect(progress(s, T0 + 5 * MIN)).toBeCloseTo(0.2);
  });

  it('never goes below zero or past full progress', () => {
    expect(remainingMs(s, T0 + 99 * MIN)).toBe(0);
    expect(progress(s, T0 + 99 * MIN)).toBe(1);
  });

  it('does not run backwards if the clock moves back', () => {
    expect(elapsedMs(s, T0 - 5000)).toBe(0);
  });
});

describe('pause and resume', () => {
  it('stops the clock while paused and carries on after', () => {
    const running = startSession('a', 25, T0);
    const paused = pauseSession(running, T0 + 10 * MIN);
    expect(isRunning(paused)).toBe(false);
    expect(remainingMs(paused, T0 + 60 * MIN)).toBe(15 * MIN); // an hour later, still 15 left
    const again = resumeSession(paused, T0 + 60 * MIN);
    expect(remainingMs(again, T0 + 65 * MIN)).toBe(10 * MIN);
  });

  it('ignores pause when paused and resume when running', () => {
    const running = startSession('a', 25, T0);
    expect(resumeSession(running, T0 + MIN)).toBe(running);
    const paused = pauseSession(running, T0 + MIN);
    expect(pauseSession(paused, T0 + 2 * MIN)).toBe(paused);
  });
});

describe('finishing and extending', () => {
  it('freezes at the full length when finished', () => {
    const done = finishSession(startSession('a', 10, T0));
    expect(done.finished).toBe(true);
    expect(isRunning(done)).toBe(false);
    expect(remainingMs(done, T0 + 99 * MIN)).toBe(0);
  });

  it('adds time to a running session without restarting it', () => {
    const s = extendSession(startSession('a', 10, T0), 5, T0 + 4 * MIN);
    expect(remainingMs(s, T0 + 4 * MIN)).toBe(11 * MIN);
  });

  it('starts running again when extended after time was up', () => {
    const done = finishSession(startSession('a', 10, T0));
    const more = extendSession(done, 5, T0 + 20 * MIN);
    expect(more.finished).toBe(false);
    expect(isRunning(more)).toBe(true);
    expect(remainingMs(more, T0 + 20 * MIN)).toBe(5 * MIN);
  });

  it('adds time to a paused session and leaves it paused', () => {
    const paused = pauseSession(startSession('a', 10, T0), T0 + 2 * MIN);
    const more = extendSession(paused, 5, T0 + 9 * MIN);
    expect(isRunning(more)).toBe(false);
    expect(remainingMs(more, T0 + 9 * MIN)).toBe(13 * MIN);
  });
});

describe('formatClock', () => {
  it('shows minutes and seconds, and hours when needed', () => {
    expect(formatClock(90_000)).toBe('1:30');
    expect(formatClock(25 * MIN)).toBe('25:00');
    expect(formatClock(3_600_000)).toBe('1:00:00');
    expect(formatClock(3_725_000)).toBe('1:02:05');
  });

  it('rounds up so it reads 0:01 until really over', () => {
    expect(formatClock(1)).toBe('0:01');
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(-50)).toBe('0:00');
  });
});

describe('pickFocusTask', () => {
  const task = (id: string, startMin: number, over: Partial<Task> = {}): Task => ({
    id, title: id, durationMin: 60, status: 'planned', date: '2026-11-02', startMin, createdAt: 0, ...over,
  });
  const today = '2026-11-02';

  it('prefers the task under way', () => {
    const tasks = [task('early', 360), task('now', 600), task('later', 900)];
    expect(pickFocusTask(tasks, today, 630)?.id).toBe('now');
  });

  it('otherwise takes the next one to start', () => {
    expect(pickFocusTask([task('a', 360), task('b', 900)], today, 700)?.id).toBe('b');
  });

  it('falls back to the first left when everything has passed', () => {
    expect(pickFocusTask([task('a', 360), task('b', 420)], today, 1300)?.id).toBe('a');
  });

  it('skips done tasks, other days and the inbox', () => {
    const tasks = [
      task('done', 600, { status: 'done' }),
      task('tomorrow', 600, { date: '2026-11-03' }),
      task('inbox', 600, { status: 'inbox', date: undefined, startMin: undefined }),
    ];
    expect(pickFocusTask(tasks, today, 600)).toBeNull();
  });
});

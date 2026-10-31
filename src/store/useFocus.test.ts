import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../types';
import { useFocus } from './useFocus';

const task = (id: string, title: string): Task => ({ id, title, durationMin: 25, status: 'planned', date: '2026-11-02', startMin: 600, createdAt: 0 });
const st = () => useFocus.getState();

describe('focus log', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 2, 10, 0, 0));
    useFocus.setState({ session: null, minimized: false, log: [] });
  });
  afterEach(() => vi.useRealTimers());

  it('logs a session when it is stopped', () => {
    st().start(task('a', 'Write'));
    vi.advanceTimersByTime(12 * 60_000);
    st().stop();
    expect(st().session).toBeNull();
    expect(st().log).toHaveLength(1);
    expect(st().log[0]).toMatchObject({ title: 'Write', date: '2026-11-02', minutes: 12 });
  });

  it('logs the earlier session when another one starts', () => {
    st().start(task('a', 'Write'));
    vi.advanceTimersByTime(5 * 60_000);
    st().start(task('b', 'Read'));
    expect(st().log.map((e) => [e.title, e.minutes])).toEqual([['Write', 5]]);
    expect(st().session?.taskId).toBe('b');
  });

  it('logs nothing for a very short session', () => {
    st().start(task('a', 'Write'));
    vi.advanceTimersByTime(20_000);
    st().stop();
    expect(st().log).toEqual([]);
  });
});

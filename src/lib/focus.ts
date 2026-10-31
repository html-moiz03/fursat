import type { Task } from '../types';

/**
 * A focus session counts down the length of one task. Time is kept as "elapsed so far"
 * plus "running since", so pausing, resuming and reloading the page never lose track of it.
 */
export type FocusSession = {
  taskId: string;
  durationMs: number;
  /** Time used up before the current run. */
  elapsedMs: number;
  /** Epoch ms when the current run began, or null while paused or finished. */
  runningSince: number | null;
  finished: boolean;
  /** The task's name when the session began, kept for the log if the task is later deleted. */
  title?: string;
};

export function startSession(taskId: string, durationMin: number, now: number, title?: string): FocusSession {
  return { taskId, durationMs: durationMin * 60_000, elapsedMs: 0, runningSince: now, finished: false, title };
}

export function elapsedMs(s: FocusSession, now: number): number {
  const running = s.runningSince === null ? 0 : Math.max(0, now - s.runningSince);
  return Math.min(s.durationMs, s.elapsedMs + running);
}

export function remainingMs(s: FocusSession, now: number): number {
  return Math.max(0, s.durationMs - elapsedMs(s, now));
}

/** 0 at the start, 1 when the time is up. */
export function progress(s: FocusSession, now: number): number {
  return s.durationMs <= 0 ? 1 : elapsedMs(s, now) / s.durationMs;
}

export const isRunning = (s: FocusSession) => s.runningSince !== null && !s.finished;

export function pauseSession(s: FocusSession, now: number): FocusSession {
  if (!isRunning(s)) return s;
  return { ...s, elapsedMs: elapsedMs(s, now), runningSince: null };
}

export function resumeSession(s: FocusSession, now: number): FocusSession {
  if (s.finished || s.runningSince !== null) return s;
  return { ...s, runningSince: now };
}

/** Time ran out: freeze the session at its full length. */
export function finishSession(s: FocusSession): FocusSession {
  return { ...s, elapsedMs: s.durationMs, runningSince: null, finished: true };
}

/** Add minutes. If the time was already up, the session starts running again. */
export function extendSession(s: FocusSession, minutes: number, now: number): FocusSession {
  const next = { ...s, durationMs: s.durationMs + minutes * 60_000 };
  return s.finished ? { ...next, finished: false, runningSince: now } : next;
}

/** 90_000 -> '1:30', 3_600_000 -> '1:00:00'. Rounds up, so the clock reads 0:01 until it is really over. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/**
 * The task the F shortcut should focus on: today's one that is under way, else the next one
 * to start, else the first left. Done tasks are skipped. Null when nothing is planned.
 */
export function pickFocusTask(tasks: Task[], today: string, nowMin: number): Task | null {
  const open = tasks
    .filter((t) => t.status === 'planned' && t.date === today && t.startMin !== undefined)
    .sort((a, b) => a.startMin! - b.startMin!);
  const underway = open.find((t) => t.startMin! <= nowMin && nowMin < t.startMin! + t.durationMin);
  return underway ?? open.find((t) => t.startMin! >= nowMin) ?? open[0] ?? null;
}

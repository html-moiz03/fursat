import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  extendSession,
  finishSession,
  isRunning,
  pauseSession,
  resumeSession,
  startSession,
  type FocusSession,
} from '../lib/focus';
import { entryFor, LOG_LIMIT, type FocusEntry } from '../lib/focusLog';
import { todayString } from '../lib/time';
import type { Task } from '../types';

type FocusState = {
  session: FocusSession | null;
  /** The full-screen view is tucked away into the small pill. Not saved. */
  minimized: boolean;
  sound: boolean;
  /** Finished stretches of focus, newest last. */
  log: FocusEntry[];

  start: (task: Task) => void;
  togglePause: () => void;
  extend: (minutes: number) => void;
  finish: () => void;
  stop: () => void;
  setMinimized: (minimized: boolean) => void;
  toggleSound: () => void;
  clearLog: () => void;
};

/** The running focus session. Saved, so a reload in the middle of a session picks up where it was. */
export const useFocus = create<FocusState>()(
  persist(
    (set, get) => ({
      session: null,
      minimized: false,
      sound: true,
      log: [],

      start: (task) => {
        get().stop(); // an unfinished earlier session still counts for the time it got
        set({ session: startSession(task.id, task.durationMin, Date.now(), task.title), minimized: false });
      },
      togglePause: () =>
        set((s) => {
          if (!s.session) return s;
          const now = Date.now();
          return { session: isRunning(s.session) ? pauseSession(s.session, now) : resumeSession(s.session, now) };
        }),
      extend: (minutes) => set((s) => (s.session ? { session: extendSession(s.session, minutes, Date.now()) } : s)),
      finish: () => set((s) => (s.session && !s.session.finished ? { session: finishSession(s.session) } : s)),
      stop: () =>
        set((s) => {
          const entry = s.session ? entryFor(s.session, Date.now(), todayString(), crypto.randomUUID()) : null;
          return { session: null, minimized: false, log: entry ? [...s.log, entry].slice(-LOG_LIMIT) : s.log };
        }),
      setMinimized: (minimized) => set({ minimized }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      clearLog: () => set({ log: [] }),
    }),
    {
      name: 'fursat:focus',
      version: 1,
      partialize: (s) => ({ session: s.session, sound: s.sound, log: s.log }),
    },
  ),
);

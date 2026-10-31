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
import type { Task } from '../types';

type FocusState = {
  session: FocusSession | null;
  /** The full-screen view is tucked away into the small pill. Not saved. */
  minimized: boolean;
  sound: boolean;

  start: (task: Task) => void;
  togglePause: () => void;
  extend: (minutes: number) => void;
  finish: () => void;
  stop: () => void;
  setMinimized: (minimized: boolean) => void;
  toggleSound: () => void;
};

/** The running focus session. Saved, so a reload in the middle of a session picks up where it was. */
export const useFocus = create<FocusState>()(
  persist(
    (set) => ({
      session: null,
      minimized: false,
      sound: true,

      start: (task) => set({ session: startSession(task.id, task.durationMin, Date.now()), minimized: false }),
      togglePause: () =>
        set((s) => {
          if (!s.session) return s;
          const now = Date.now();
          return { session: isRunning(s.session) ? pauseSession(s.session, now) : resumeSession(s.session, now) };
        }),
      extend: (minutes) => set((s) => (s.session ? { session: extendSession(s.session, minutes, Date.now()) } : s)),
      finish: () => set((s) => (s.session && !s.session.finished ? { session: finishSession(s.session) } : s)),
      stop: () => set({ session: null, minimized: false }),
      setMinimized: (minimized) => set({ minimized }),
      toggleSound: () => set((s) => ({ sound: !s.sound })),
    }),
    {
      name: 'fursat:focus',
      version: 1,
      partialize: (s) => ({ session: s.session, sound: s.sound }),
    },
  ),
);

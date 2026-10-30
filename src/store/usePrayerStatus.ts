import { create } from 'zustand';

type Status = 'idle' | 'loading' | 'ready' | 'error';

type PrayerStatus = {
  status: Status;
  message: string;
  /** Bumped by the Retry button so the sync effect runs again. */
  retry: number;
  set: (status: Status, message?: string) => void;
  bumpRetry: () => void;
};

/** What the prayer-time sync is doing right now. Not saved: it is only a live status. */
export const usePrayerStatus = create<PrayerStatus>((set) => ({
  status: 'idle',
  message: '',
  retry: 0,
  set: (status, message = '') => set({ status, message }),
  bumpRetry: () => set((s) => ({ retry: s.retry + 1 })),
}));

import { create } from 'zustand';

export type Toast = { id: number; message: string; tone: 'info' | 'warn' };

type ToastState = {
  toasts: Toast[];
  show: (message: string, tone?: Toast['tone']) => void;
  dismiss: (id: number) => void;
};

let next = 1;

/** Short-lived messages, for things the app would otherwise do silently (such as a drop that does not fit). */
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  show: (message, tone = 'info') => {
    const id = next++;
    // Same message twice in a row replaces the first instead of stacking.
    set((s) => ({ toasts: [...s.toasts.filter((t) => t.message !== message), { id, message, tone }].slice(-3) }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3800);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

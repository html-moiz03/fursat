import { create } from 'zustand';

/**
 * The task currently picked up with the keyboard, plus the line a screen reader should hear.
 * Lives outside the task block because moving a task to another day remounts its block.
 */
type CarryState = {
  id: string | null;
  origin: { date: string; startMin: number } | null;
  message: string;
  lift: (id: string, origin: { date: string; startMin: number } | null) => void;
  release: () => void;
  say: (message: string) => void;
};

export const useCarry = create<CarryState>((set) => ({
  id: null,
  origin: null,
  message: '',
  lift: (id, origin) => set({ id, origin }),
  release: () => set({ id: null, origin: null }),
  say: (message) => set({ message }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Anchor, Settings, Task } from '../types';
import { toMinutes, todayString } from '../lib/time';

const SAMPLE_ANCHORS: Anchor[] = [
  {
    id: 'sample-work',
    title: 'Work',
    startMin: toMinutes('09:00'),
    endMin: toMinutes('17:00'),
    repeatDays: [1, 2, 3, 4, 5],
    kind: 'work',
    source: 'manual',
    color: '#2f6f5e',
  },
  {
    id: 'sample-class',
    title: 'Class',
    startMin: toMinutes('18:00'),
    endMin: toMinutes('19:30'),
    repeatDays: [1, 3],
    kind: 'class',
    source: 'manual',
    color: '#8a5a2b',
  },
  {
    id: 'sample-dinner',
    title: 'Dinner',
    startMin: toMinutes('20:00'),
    endMin: toMinutes('20:45'),
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    kind: 'meal',
    source: 'manual',
    color: '#9b4d5a',
  },
];

const DEFAULT_SETTINGS: Settings = {
  dayStartMin: toMinutes('06:00'),
  dayEndMin: toMinutes('23:00'),
  minGapMin: 10,
  theme: 'system',
};

type PlannerState = {
  anchors: Anchor[];
  tasks: Task[];
  settings: Settings;
  selectedDate: string;

  addAnchor: (anchor: Omit<Anchor, 'id' | 'source'>) => void;
  removeAnchor: (id: string) => void;
  addTask: (title: string, durationMin: number) => void;
  removeTask: (id: string) => void;
  setSelectedDate: (date: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      anchors: SAMPLE_ANCHORS,
      tasks: [],
      settings: DEFAULT_SETTINGS,
      selectedDate: todayString(),

      addAnchor: (anchor) =>
        set((s) => ({
          anchors: [...s.anchors, { ...anchor, id: crypto.randomUUID(), source: 'manual' }],
        })),
      removeAnchor: (id) => set((s) => ({ anchors: s.anchors.filter((a) => a.id !== id) })),
      addTask: (title, durationMin) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            { id: crypto.randomUUID(), title, durationMin, status: 'inbox', createdAt: Date.now() },
          ],
        })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      setSelectedDate: (date) => set({ selectedDate: date }),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'fursat:v1',
      version: 1,
      // selectedDate is not saved: reopening the app should land on today.
      partialize: (s) => ({ anchors: s.anchors, tasks: s.tasks, settings: s.settings }),
    },
  ),
);

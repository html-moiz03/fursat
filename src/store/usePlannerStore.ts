import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Anchor, PrayerSettings, Settings, Task } from '../types';
import { overdueTasks, planCarryOver } from '../lib/carryOver';
import { fitFrom, maxDuration, moveTargets, placedOn, snapDuration, stepStart } from '../lib/fit';
import { computeGaps } from '../lib/gaps';
import { toMinutes, todayString } from '../lib/time';
import { slotOnDay } from '../lib/week';

const sampleAnchors = (): Anchor[] => [
  {
    id: 'sample-work',
    title: 'Work',
    startMin: toMinutes('09:00'),
    endMin: toMinutes('17:00'),
    repeatDays: [1, 2, 3, 4, 5],
    kind: 'work',
    source: 'manual',
    color: '#4f7f70',
  },
  {
    id: 'sample-class',
    title: 'Class',
    startMin: toMinutes('18:00'),
    endMin: toMinutes('19:30'),
    repeatDays: [1, 3],
    kind: 'class',
    source: 'manual',
    color: '#8f6b47',
  },
  {
    id: 'sample-dinner',
    title: 'Dinner',
    startMin: toMinutes('20:00'),
    endMin: toMinutes('20:45'),
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    kind: 'meal',
    source: 'manual',
    color: '#a0606b',
  },
];

export const DEFAULT_PRAYER: PrayerSettings = {
  enabled: false,
  city: '',
  country: '',
  method: 1, // University of Islamic Sciences, Karachi
  school: 1, // Hanafi Asr
  durationMin: 20,
};

const DEFAULT_SETTINGS: Settings = {
  dayStartMin: toMinutes('06:00'),
  dayEndMin: toMinutes('23:00'),
  minGapMin: 10,
  theme: 'light',
};

type PlannerState = {
  anchors: Anchor[];
  tasks: Task[];
  settings: Settings;
  selectedDate: string;

  addAnchor: (anchor: Omit<Anchor, 'id' | 'source'>) => void;
  removeAnchor: (id: string) => void;
  /** Change a manual anchor. Tasks placed over its new time are flagged as conflicts, not moved. */
  updateAnchor: (id: string, patch: Partial<Omit<Anchor, 'id' | 'source'>>) => void;
  addTask: (title: string, durationMin: number) => void;
  removeTask: (id: string) => void;
  /**
   * Put an inbox task into the gap that contains `fromMin`, at the earliest time
   * at or after `fromMin` that fits. Pass a gap's start to use the whole gap.
   * Returns false (and changes nothing) if it does not fit.
   */
  planTask: (id: string, date: string, fromMin: number) => boolean;
  /**
   * Put a task on `date` at the earliest free time at or after `fromMin`, wherever in the day that is.
   * Used when a task is dropped on a day in the week view. Returns false (and changes nothing) if the day has no room.
   */
  planTaskOnDay: (id: string, date: string, fromMin: number) => boolean;
  /** Replace the anchors with a typical weekday so a new visitor can see the idea. */
  loadSample: () => void;
  /** Remove every anchor and task, and switch prayer times off. */
  clearAll: () => void;
  /**
   * Change the prayer-time setup. Any change that affects the times drops the
   * prayer anchors so they are fetched again.
   */
  setPrayerSettings: (patch: Partial<PrayerSettings>) => void;
  /** Replace the prayer anchors of one month ('YYYY-MM') with freshly fetched ones. */
  addPrayerAnchors: (month: string, anchors: Anchor[]) => void;
  /** Send a planned or done task back to the inbox. */
  unplanTask: (id: string) => void;
  /** Change a placed task's length, keeping its start. Snaps to 5 minutes and stops at the next obstacle. Returns the new length, or null if it cannot be resized. */
  resizeTask: (id: string, wantedMin: number) => number | null;
  /** Move a placed task to the next (dir 1) or previous (dir -1) free spot on its day. Returns the new start, or null when there is none. */
  nudgeTask: (id: string, dir: 1 | -1) => number | null;
  /**
   * Move unfinished tasks from earlier days into what is left of `today`, from `fromMin` on.
   * A task with no room left goes to the inbox. Returns how many went where.
   */
  carryOverdue: (today: string, fromMin: number) => { moved: number; inbox: number };
  /** Send every unfinished task from before `today` back to the inbox. Returns how many. */
  inboxOverdue: (today: string) => number;
  /** Tick a planned task as done, or untick it. */
  toggleDone: (id: string) => void;
  setSelectedDate: (date: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      anchors: [],
      tasks: [],
      settings: DEFAULT_SETTINGS,
      selectedDate: todayString(),

      addAnchor: (anchor) =>
        set((s) => ({
          anchors: [...s.anchors, { ...anchor, id: crypto.randomUUID(), source: 'manual' }],
        })),
      removeAnchor: (id) => set((s) => ({ anchors: s.anchors.filter((a) => a.id !== id) })),
      updateAnchor: (id, patch) =>
        set((s) => ({
          anchors: s.anchors.map((a) => (a.id === id && a.source === 'manual' ? { ...a, ...patch } : a)),
        })),

      addTask: (title, durationMin) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            { id: crypto.randomUUID(), title, durationMin, status: 'inbox', createdAt: Date.now() },
          ],
        })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      planTask: (id, date, fromMin) => {
        const { tasks, anchors, settings } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task) return false;

        // The task's own old slot (if any) must not block its new one.
        const result = fitFrom(
          task.durationMin,
          computeGaps(anchors, date, settings),
          fromMin,
          placedOn(tasks, date, id),
        );
        if (!result || !result.fits) return false;

        set({
          tasks: tasks.map((t) =>
            // A done task keeps its ticked state when it is moved.
            t.id === id
              ? { ...t, status: t.status === 'done' ? 'done' : 'planned', date, startMin: result.startMin }
              : t,
          ),
        });
        return true;
      },
      planTaskOnDay: (id, date, fromMin) => {
        const { tasks, anchors, settings } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task) return false;
        const startMin = slotOnDay(task, anchors, tasks, date, fromMin, settings);
        if (startMin === null) return false;
        set({
          tasks: tasks.map((t) =>
            t.id === id ? { ...t, status: t.status === 'done' ? 'done' : 'planned', date, startMin } : t,
          ),
        });
        return true;
      },
      loadSample: () =>
        set((s) => ({ anchors: [...s.anchors.filter((a) => a.source === 'prayer-api'), ...sampleAnchors()] })),
      clearAll: () =>
        set((s) => ({ anchors: [], tasks: [], settings: { ...s.settings, prayer: undefined } })),
      setPrayerSettings: (patch) =>
        set((s) => {
          const current = s.settings.prayer ?? DEFAULT_PRAYER;
          const next = { ...current, ...patch };
          const changed = (Object.keys(next) as (keyof PrayerSettings)[]).some((k) => current[k] !== next[k]);
          return {
            settings: { ...s.settings, prayer: next },
            anchors: changed ? s.anchors.filter((a) => a.source !== 'prayer-api') : s.anchors,
          };
        }),
      addPrayerAnchors: (month, fetched) =>
        set((s) => ({
          anchors: [
            ...s.anchors.filter((a) => !(a.source === 'prayer-api' && a.date?.startsWith(month))),
            ...fetched,
          ],
        })),
      resizeTask: (id, wantedMin) => {
        const { tasks, anchors, settings } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task || task.status === 'inbox' || task.date === undefined) return null;
        const max = maxDuration(task, computeGaps(anchors, task.date, { ...settings, minGapMin: 0 }), placedOn(tasks, task.date, id));
        if (max === null) return null;
        const durationMin = snapDuration(wantedMin, max);
        if (durationMin !== task.durationMin) {
          set({ tasks: tasks.map((t) => (t.id === id ? { ...t, durationMin } : t)) });
        }
        return durationMin;
      },
      nudgeTask: (id, dir) => {
        const { tasks, anchors, settings } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task || task.status === 'inbox' || task.date === undefined || task.startMin === undefined) return null;
        const targets = moveTargets(
          task.durationMin,
          computeGaps(anchors, task.date, settings),
          placedOn(tasks, task.date, id),
        );
        const next = stepStart(targets, task.startMin, dir);
        if (next === null) return null;
        return get().planTask(id, task.date, next) ? next : null;
      },
      unplanTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: 'inbox', date: undefined, startMin: undefined } : t,
          ),
        })),
      carryOverdue: (today, fromMin) => {
        const { tasks, anchors, settings } = get();
        const plan = planCarryOver(tasks, anchors, today, fromMin, settings);
        const spots = new Map(plan.moved.map((m) => [m.id, m.startMin]));
        const back = new Set(plan.toInbox);
        set({
          tasks: tasks.map((t) => {
            const spot = spots.get(t.id);
            if (spot !== undefined) return { ...t, status: 'planned', date: today, startMin: spot };
            if (back.has(t.id)) return { ...t, status: 'inbox', date: undefined, startMin: undefined };
            return t;
          }),
        });
        return { moved: plan.moved.length, inbox: plan.toInbox.length };
      },
      inboxOverdue: (today) => {
        const ids = new Set(overdueTasks(get().tasks, today).map((t) => t.id));
        set((s) => ({
          tasks: s.tasks.map((t) =>
            ids.has(t.id) ? { ...t, status: 'inbox', date: undefined, startMin: undefined } : t,
          ),
        }));
        return ids.size;
      },
      toggleDone: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id && t.status !== 'inbox'
              ? { ...t, status: t.status === 'done' ? 'planned' : 'done' }
              : t,
          ),
        })),

      setSelectedDate: (date) => set({ selectedDate: date }),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'fursat:v1',
      version: 2,
      // v1 saved theme as 'system' without ever using it; keep those visitors on the calm light look.
      migrate: (persisted, version) => {
        const state = persisted as { settings?: Settings };
        if (version < 2 && state.settings?.theme === 'system') state.settings.theme = 'light';
        return state as unknown as PlannerState;
      },
      // selectedDate is not saved: reopening the app should land on today.
      partialize: (s) => ({ anchors: s.anchors, tasks: s.tasks, settings: s.settings }),
    },
  ),
);

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { checkFit, type Range } from '../lib/fit';
import { formatDuration, nowMinutes, todayString } from '../lib/time';
import { firstStart } from '../lib/week';
import type { Task } from '../types';
import { usePlannerStore } from '../store/usePlannerStore';
import { useToasts } from '../store/useToasts';

const ActiveTaskContext = createContext<Task | null>(null);

/** The inbox task being dragged right now, or null. */
export const useActiveTask = () => useContext(ActiveTaskContext);

/**
 * Lets tasks be dragged into free time on the timeline (Today) or onto a day (Week). The
 * placing rules are planTask() and planTaskOnDay(), so a drop that does not fit is simply
 * ignored. The dropdown in the inbox stays as the keyboard route.
 */
export function PlannerDnd({ children }: { children: ReactNode }) {
  const tasks = usePlannerStore((s) => s.tasks);
  const date = usePlannerStore((s) => s.selectedDate);
  const planTask = usePlannerStore((s) => s.planTask);
  const planTaskOnDay = usePlannerStore((s) => s.planTaskOnDay);
  const showToast = useToasts((s) => s.show);
  const dayStartMin = usePlannerStore((s) => s.settings.dayStartMin);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );

  const active = tasks.find((t) => t.id === activeId) ?? null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const task = tasks.find((t) => t.id === e.active.id);
    // Week view: dropped on a whole day.
    const day = e.over?.data.current?.day as string | undefined;
    if (task && day) {
      const ok = planTaskOnDay(task.id, day, firstStart(day, todayString(), nowMinutes(), dayStartMin));
      if (!ok) showToast(`No room for ${formatDuration(task.durationMin)} on that day.`, 'warn');
      return;
    }
    const zone = e.over?.data.current?.zone as Range | undefined;
    if (!task || !zone) return;
    const verdict = checkFit(task.durationMin, zone, []);
    if (verdict.fits) planTask(task.id, date, zone.startMin);
    else showToast(`Too short: needs ${formatDuration(task.durationMin)}, this gap is ${formatDuration(zone.endMin - zone.startMin)}.`, 'warn');
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <ActiveTaskContext.Provider value={active}>{children}</ActiveTaskContext.Provider>
      <DragOverlay dropAnimation={null}>
        {active ? (
          <div className="w-fit whitespace-nowrap rounded-xl bg-card px-3 py-2 text-sm shadow-lg ring-2 ring-brand">
            <span className="font-medium">{active.title}</span>{' '}
            <span className="text-muted">{formatDuration(active.durationMin)}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

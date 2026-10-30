import { useDroppable } from '@dnd-kit/core';
import { useMemo } from 'react';
import { freeZonesFor } from '../lib/day';
import { checkFit, hasConflict, type Range } from '../lib/fit';
import { anchorsForDate } from '../lib/gaps';
import { formatDuration, fromMinutes, todayString } from '../lib/time';
import { useNowMinutes } from '../lib/useNow';
import { usePlannerStore } from '../store/usePlannerStore';
import { useActiveTask } from './PlannerDnd';
import { TaskBlock } from './TaskBlock';

const PX_PER_MIN = 1;

/** A stretch of free time. While a task is dragged it shows whether the task fits and accepts the drop. */
function FreeZone({ zone, top, height }: { zone: Range; top: number; height: number }) {
  const active = useActiveTask();
  const { setNodeRef, isOver } = useDroppable({ id: `zone-${zone.startMin}`, data: { zone } });

  const size = zone.endMin - zone.startMin;
  const verdict = active ? checkFit(active.durationMin, zone, []) : null;
  const fits = verdict?.fits === true;

  let style = 'border-dashed border-brand/30 bg-brand-soft/70 text-brand';
  let label = `${formatDuration(size)} free (${fromMinutes(zone.startMin)}–${fromMinutes(zone.endMin)})`;
  if (active && fits) {
    style = isOver ? 'border-solid border-brand bg-brand/25 text-brand ring-2 ring-brand' : 'border-solid border-brand/70 bg-brand-soft text-brand';
    label = isOver
      ? `Drop to place ${fromMinutes(zone.startMin)}–${fromMinutes(zone.startMin + active.durationMin)}`
      : `Fits · ${formatDuration(size)} free`;
  } else if (active && verdict && !verdict.fits) {
    style = 'border-dashed border-line bg-page text-muted opacity-70';
    label = `Too short · ${formatDuration(size)} free`;
  }

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-2 right-2 flex items-center justify-center overflow-hidden rounded-lg border text-sm font-medium transition-colors ${style}`}
      style={{ top, height }}
    >
      {label}
    </div>
  );
}

export function Timeline() {
  const anchors = usePlannerStore((s) => s.anchors);
  const tasks = usePlannerStore((s) => s.tasks);
  const settings = usePlannerStore((s) => s.settings);
  const date = usePlannerStore((s) => s.selectedDate);
  const now = useNowMinutes();

  const { dayStartMin, dayEndMin, minGapMin } = settings;

  const blocks = useMemo(
    () =>
      anchors
        .flatMap((anchor) =>
          anchorsForDate([anchor], date).map(([s, e]) => ({
            anchor,
            startMin: Math.max(s, dayStartMin),
            endMin: Math.min(e, dayEndMin),
          })),
        )
        .filter((b) => b.endMin > b.startMin),
    [anchors, date, dayStartMin, dayEndMin],
  );

  // Tasks on this day, and the free time that is left once they are taken out of the gaps.
  const dayTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'inbox' && t.date === date && t.startMin !== undefined),
    [tasks, date],
  );
  const freeZones = useMemo(
    () => freeZonesFor(anchors, tasks, date, { dayStartMin, dayEndMin, minGapMin }),
    [anchors, tasks, date, dayStartMin, dayEndMin, minGapMin],
  );

  const hours: number[] = [];
  for (let h = Math.ceil(dayStartMin / 60); h <= Math.floor(dayEndMin / 60); h++) hours.push(h);

  const top = (min: number) => (min - dayStartMin) * PX_PER_MIN;
  const showNow = date === todayString() && now >= dayStartMin && now <= dayEndMin;

  return (
    <section aria-label="Timeline for the selected day">
      <div
        className="relative ml-14 border-l border-line"
        style={{ height: (dayEndMin - dayStartMin) * PX_PER_MIN }}
      >
        {hours.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-line"
            style={{ top: top(h * 60) }}
          >
            <span className="absolute -left-14 -top-2.5 w-12 pr-2 text-right text-xs text-muted">
              {fromMinutes(h * 60)}
            </span>
          </div>
        ))}

        {freeZones.map((z) => (
          <FreeZone
            key={`free-${z.startMin}`}
            zone={z}
            top={top(z.startMin)}
            height={(z.endMin - z.startMin) * PX_PER_MIN}
          />
        ))}

        {blocks.map((b, i) => (
          <div
            key={`${b.anchor.id}-${i}`}
            className="absolute left-2 right-2 overflow-hidden rounded-md px-2 py-1 text-sm text-white shadow-sm"
            style={{
              top: top(b.startMin),
              height: (b.endMin - b.startMin) * PX_PER_MIN,
              backgroundColor: b.anchor.color,
              opacity: 0.95,
            }}
          >
            <span className="font-medium">{b.anchor.title}</span>{' '}
            <span className="text-white/80">
              {fromMinutes(b.startMin)}–{fromMinutes(b.endMin)}
            </span>
          </div>
        ))}

        {dayTasks.map((t) => (
          <TaskBlock
            key={t.id}
            task={t}
            top={top(t.startMin ?? 0)}
            height={t.durationMin * PX_PER_MIN}
            conflict={hasConflict(t, anchors, { dayStartMin, dayEndMin, minGapMin })}
          />
        ))}

        {showNow && (
          <div
            className="pointer-events-none absolute -left-1 right-0 z-10 border-t-2 border-red-500"
            style={{ top: top(now) }}
            aria-label={`Now, ${fromMinutes(now)}`}
          >
            <span className="absolute -left-14 -top-2.5 w-12 pr-2 text-right text-xs font-semibold text-red-500">
              {fromMinutes(now)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

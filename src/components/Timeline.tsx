import { useMemo } from 'react';
import { freeZonesFor } from '../lib/day';
import { hasConflict } from '../lib/fit';
import { anchorsForDate } from '../lib/gaps';
import { formatDuration, fromMinutes, todayString } from '../lib/time';
import { useNowMinutes } from '../lib/useNow';
import { usePlannerStore } from '../store/usePlannerStore';
import { TaskBlock } from './TaskBlock';

const PX_PER_MIN = 1;

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
          <div
            key={`free-${z.startMin}`}
            className="absolute left-2 right-2 flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-brand/50 bg-brand-soft text-sm font-medium text-brand"
            style={{ top: top(z.startMin), height: (z.endMin - z.startMin) * PX_PER_MIN }}
          >
            {formatDuration(z.endMin - z.startMin)} free ({fromMinutes(z.startMin)}–{fromMinutes(z.endMin)})
          </div>
        ))}

        {blocks.map((b, i) => (
          <div
            key={`${b.anchor.id}-${i}`}
            className="absolute left-2 right-2 overflow-hidden rounded-md px-2 py-1 text-sm text-white shadow-sm"
            style={{
              top: top(b.startMin),
              height: (b.endMin - b.startMin) * PX_PER_MIN,
              backgroundColor: b.anchor.color,
              opacity: 0.92,
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

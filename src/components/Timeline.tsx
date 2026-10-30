import { useEffect, useMemo, useState } from 'react';
import { anchorsForDate, computeGaps } from '../lib/gaps';
import { formatDuration, fromMinutes, nowMinutes, todayString } from '../lib/time';
import { usePlannerStore } from '../store/usePlannerStore';

const PX_PER_MIN = 1;

/** Re-renders once a minute so the "now" line moves. */
function useNowMinutes(): number {
  const [now, setNow] = useState(nowMinutes());
  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Timeline() {
  const anchors = usePlannerStore((s) => s.anchors);
  const settings = usePlannerStore((s) => s.settings);
  const date = usePlannerStore((s) => s.selectedDate);
  const now = useNowMinutes();

  const { dayStartMin, dayEndMin, minGapMin } = settings;

  const gaps = useMemo(
    () => computeGaps(anchors, date, { dayStartMin, dayEndMin, minGapMin }),
    [anchors, date, dayStartMin, dayEndMin, minGapMin],
  );

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

  const hours: number[] = [];
  for (let h = Math.ceil(dayStartMin / 60); h <= Math.floor(dayEndMin / 60); h++) hours.push(h);

  const top = (min: number) => (min - dayStartMin) * PX_PER_MIN;
  const showNow = date === todayString() && now >= dayStartMin && now <= dayEndMin;
  const totalFree = gaps.reduce((sum, g) => sum + g.lengthMin, 0);

  return (
    <section aria-label="Timeline for the selected day">
      <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
        {gaps.length === 0
          ? 'No free time left in this day window.'
          : `${formatDuration(totalFree)} free across ${gaps.length} ${gaps.length === 1 ? 'gap' : 'gaps'}.`}
      </p>

      <div
        className="relative ml-14 border-l border-stone-300 dark:border-stone-700"
        style={{ height: (dayEndMin - dayStartMin) * PX_PER_MIN }}
      >
        {hours.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-stone-200 dark:border-stone-800"
            style={{ top: top(h * 60) }}
          >
            <span className="absolute -left-14 -top-2.5 w-12 pr-2 text-right text-xs text-stone-500">
              {fromMinutes(h * 60)}
            </span>
          </div>
        ))}

        {gaps.map((g) => (
          <div
            key={`gap-${g.startMin}`}
            className="absolute left-2 right-2 flex items-center justify-center rounded-md border border-dashed border-emerald-600/60 bg-emerald-500/10 text-sm font-medium text-emerald-800 dark:text-emerald-300"
            style={{ top: top(g.startMin), height: g.lengthMin * PX_PER_MIN }}
          >
            {formatDuration(g.lengthMin)} free ({fromMinutes(g.startMin)}–{fromMinutes(g.endMin)})
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

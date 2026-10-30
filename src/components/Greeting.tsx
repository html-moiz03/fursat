import { useMemo } from 'react';
import { freeZonesFor, upNext } from '../lib/day';
import { formatDuration, fromMinutes, todayString } from '../lib/time';
import { useNowMinutes } from '../lib/useNow';
import { usePlannerStore } from '../store/usePlannerStore';

function greetingFor(min: number): string {
  if (min < 12 * 60) return 'Good morning';
  if (min < 17 * 60) return 'Good afternoon';
  return 'Good evening';
}

function shortDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function Greeting() {
  const anchors = usePlannerStore((s) => s.anchors);
  const tasks = usePlannerStore((s) => s.tasks);
  const settings = usePlannerStore((s) => s.settings);
  const date = usePlannerStore((s) => s.selectedDate);
  const now = useNowMinutes();

  const { dayStartMin, dayEndMin, minGapMin } = settings;
  const isToday = date === todayString();

  const zones = useMemo(
    () => freeZonesFor(anchors, tasks, date, { dayStartMin, dayEndMin, minGapMin }),
    [anchors, tasks, date, dayStartMin, dayEndMin, minGapMin],
  );
  const totalFree = zones.reduce((sum, z) => sum + (z.endMin - z.startMin), 0);
  const items = useMemo(() => upNext(anchors, tasks, date, isToday ? now : -1), [anchors, tasks, date, isToday, now]);

  const freeLine =
    zones.length === 0
      ? 'No free time left in this day.'
      : `${formatDuration(totalFree)} free across ${zones.length} ${zones.length === 1 ? 'gap' : 'gaps'}.`;

  return (
    <section
      aria-label="Day overview"
      className="relative overflow-hidden rounded-2xl p-5 shadow-sm ring-1 ring-line sm:p-6"
      style={{ background: 'linear-gradient(135deg, var(--hero-from), var(--hero-to))' }}
    >
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 62 C60 38 120 82 200 60 S340 40 400 58 V100 H0Z" fill="var(--hero-wave-1)" opacity="0.7" />
        <path d="M0 80 C70 62 130 96 210 78 S350 66 400 80 V100 H0Z" fill="var(--hero-wave-2)" opacity="0.8" />
      </svg>

      <div className="relative grid gap-5 pb-8 sm:grid-cols-[1fr_minmax(0,17rem)] sm:items-start">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {isToday ? greetingFor(now) : shortDate(date)}
          </h2>
          <p className="mt-1 text-sm text-muted">{freeLine}</p>
        </div>

        <div className="rounded-xl bg-card/90 p-3 shadow-sm ring-1 ring-line backdrop-blur">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {isToday ? 'Up next' : 'First up'}
          </h3>
          {items.length === 0 ? (
            <p className="text-sm text-muted">{isToday ? 'Nothing else today.' : 'Nothing scheduled.'}</p>
          ) : (
            <ul className="space-y-2">
              {items.map((i) => (
                <li key={i.id} className="flex gap-2.5">
                  <span className="w-1 shrink-0 rounded-full" style={{ backgroundColor: i.color }} />
                  <span className="min-w-0 text-sm">
                    <span className="block truncate font-medium">{i.title}</span>
                    <span className="text-xs text-muted">
                      {isToday && i.startMin <= now ? 'Now · until ' : `${fromMinutes(i.startMin)}–`}
                      {fromMinutes(i.endMin)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

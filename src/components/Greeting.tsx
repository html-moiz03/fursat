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
    <section aria-label="Day overview" className="rounded-2xl bg-card p-6 ring-1 ring-line sm:p-8">
      <div className="grid gap-6 sm:grid-cols-[1fr_minmax(0,17rem)] sm:items-start">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            {isToday ? greetingFor(now) : shortDate(date)}
          </h2>
          <p className="mt-2 text-base text-muted">{freeLine}</p>
        </div>

        <div className="rounded-xl bg-page p-4">
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

import { useMemo } from 'react';
import { formatDuration, fromMinutes, todayString } from '../lib/time';
import { dayOverview, weekDates } from '../lib/week';
import { usePlannerStore } from '../store/usePlannerStore';

function dayParts(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return {
    weekday: dt.toLocaleDateString(undefined, { weekday: 'short' }),
    day: dt.getDate(),
    month: dt.toLocaleDateString(undefined, { month: 'short' }),
  };
}

/** Seven days side by side: what is fixed, what is planned, and how much time is left. */
export function WeekView({ onOpenDay }: { onOpenDay: (date: string) => void }) {
  const anchors = usePlannerStore((s) => s.anchors);
  const tasks = usePlannerStore((s) => s.tasks);
  const settings = usePlannerStore((s) => s.settings);
  const selected = usePlannerStore((s) => s.selectedDate);
  const { dayStartMin, dayEndMin, minGapMin } = settings;
  const today = todayString();

  const days = useMemo(
    () => weekDates(selected).map((date) => dayOverview(anchors, tasks, date, { dayStartMin, dayEndMin, minGapMin })),
    [anchors, tasks, selected, dayStartMin, dayEndMin, minGapMin],
  );

  const totalFree = days.reduce((sum, d) => sum + d.freeMin, 0);
  const totalPlanned = days.reduce((sum, d) => sum + d.plannedMin, 0);

  return (
    <section aria-label="Week overview">
      <p className="mb-4 text-sm text-muted">
        {formatDuration(totalFree)} free this week · {formatDuration(totalPlanned)} planned
      </p>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {days.map((d) => {
          const { weekday, day, month } = dayParts(d.date);
          const isToday = d.date === today;
          return (
            <li
              key={d.date}
              className={`flex min-w-0 flex-col rounded-2xl bg-card p-3 ring-1 ${isToday ? 'ring-2 ring-brand' : 'ring-line'}`}
            >
              <button
                type="button"
                onClick={() => onOpenDay(d.date)}
                aria-label={`Open ${weekday} ${day} ${month}`}
                className="mb-2 block w-full rounded-lg text-left hover:bg-brand-soft"
              >
                <span className={`block text-xs font-medium uppercase tracking-wide ${isToday ? 'text-brand' : 'text-muted'}`}>
                  {weekday}
                </span>
                <span className="block text-lg font-semibold leading-tight">
                  {day} <span className="text-sm font-normal text-muted">{month}</span>
                </span>
                <span className="block text-xs text-muted">{formatDuration(d.freeMin)} free</span>
              </button>

              {d.items.length === 0 ? (
                <p className="text-xs text-muted">Nothing fixed or planned.</p>
              ) : (
                <ul className="space-y-1.5">
                  {d.items.map((item) => (
                    <li
                      key={item.id}
                      className="min-w-0 rounded-md border-l-4 bg-page px-2 py-1 text-xs"
                      style={{ borderLeftColor: item.color }}
                      title={`${item.title}, ${fromMinutes(item.startMin)}–${fromMinutes(item.endMin)}`}
                    >
                      <span className={`block truncate font-medium ${item.done ? 'line-through opacity-60' : ''}`}>
                        {item.title}
                      </span>
                      <span className="block text-muted">
                        {fromMinutes(item.startMin)}–{fromMinutes(item.endMin)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

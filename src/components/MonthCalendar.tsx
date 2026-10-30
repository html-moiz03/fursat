import { useEffect, useMemo, useState } from 'react';
import { monthGrid, shiftMonth } from '../lib/calendar';
import { todayString } from '../lib/time';
import { usePlannerStore } from '../store/usePlannerStore';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function longDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function MonthCalendar() {
  const selected = usePlannerStore((s) => s.selectedDate);
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate);
  const tasks = usePlannerStore((s) => s.tasks);

  // The month on screen follows the selected day, but can be browsed without changing it.
  const [ym, setYm] = useState(selected.slice(0, 7));
  useEffect(() => setYm(selected.slice(0, 7)), [selected]);

  const [y, m] = ym.split('-').map(Number);
  const cells = useMemo(() => monthGrid(y, m - 1), [y, m]);
  const today = todayString();

  const perDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      if (t.status !== 'inbox' && t.date) counts.set(t.date, (counts.get(t.date) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  const arrow = 'grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink';

  return (
    <section aria-label="Month calendar">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className={arrow} onClick={() => setYm(shiftMonth(ym, -1))} aria-label="Previous month">
          ‹
        </button>
        <h2 className="text-sm font-semibold">
          {new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <button type="button" className={arrow} onClick={() => setYm(shiftMonth(ym, 1))} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-1 text-[11px] text-muted">
            {d}
          </span>
        ))}
        {cells.map((date) => {
          const inMonth = date.slice(0, 7) === ym;
          const isSelected = date === selected;
          const dots = Math.min(perDay.get(date) ?? 0, 3);
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelectedDate(date)}
              aria-label={longDate(date)}
              aria-pressed={isSelected}
              aria-current={date === today ? 'date' : undefined}
              className="group mx-auto flex h-10 w-10 flex-col items-center justify-center"
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-sm ${
                  isSelected
                    ? 'bg-brand font-semibold text-on-brand'
                    : date === today
                      ? 'font-semibold text-brand ring-1 ring-brand'
                      : inMonth
                        ? 'group-hover:bg-brand-soft'
                        : 'text-muted/50'
                }`}
              >
                {Number(date.slice(8))}
              </span>
              <span className="mt-0.5 flex h-1 gap-0.5" aria-hidden="true">
                {Array.from({ length: dots }, (_, i) => (
                  <span key={i} className="h-1 w-1 rounded-full bg-brand" />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

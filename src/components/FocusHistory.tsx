import { m } from 'motion/react';
import { useEffect, useState } from 'react';
import { dayTotals, formatFocused, groupByDay, lastDays, streak } from '../lib/focusLog';
import { todayString } from '../lib/time';
import { useFocus } from '../store/useFocus';

function dayLabel(date: string, today: string): string {
  if (date === today) return 'Today';
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-line backdrop-blur-md">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="display mt-1 text-2xl">{value}</p>
    </div>
  );
}

/** What has been focused on: totals, a 14-day bar chart and the sessions, newest first. */
export function FocusHistory() {
  const log = useFocus((s) => s.log);
  const clearLog = useFocus((s) => s.clearLog);
  const [confirming, setConfirming] = useState(false);
  const today = todayString();

  // The "are you sure" asking lapses by itself.
  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  const days = lastDays(today, 14);
  const totals = dayTotals(log, days);
  const peak = Math.max(30, ...totals);
  const week = totals.slice(-7).reduce((a, b) => a + b, 0);
  const groups = groupByDay(log).slice(0, 30);

  if (log.length === 0) {
    return (
      <section aria-label="Focus history" className="surface max-w-xl rounded-3xl p-8 text-center">
        <h2 className="display text-2xl">No focus time yet</h2>
        <p className="mt-2 text-muted">
          Press ▶ on a task in Today, or hit <kbd>F</kbd>, and the time you spend will show up here.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Focus history" className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Today" value={formatFocused(totals[13]) || '0m'} />
        <Stat label="Last 7 days" value={formatFocused(week) || '0m'} />
        <Stat label="Streak" value={`${streak(log, today)} ${streak(log, today) === 1 ? 'day' : 'days'}`} />
        <Stat label="Sessions" value={String(log.length)} />
      </div>

      <div className="surface rounded-3xl p-5">
        <h2 className="mb-4 text-sm font-medium text-muted">Last 14 days</h2>
        <ul className="flex h-40 items-end gap-1.5 sm:gap-2" aria-label="Minutes focused per day">
          {days.map((d, i) => (
            <li key={d} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${dayLabel(d, today)}: ${formatFocused(totals[i]) || 'nothing'}`}>
              <span className="text-[10px] text-muted">{totals[i] > 0 ? formatFocused(totals[i]) : ''}</span>
              <m.span
                className={`w-full rounded-t-md ${d === today ? 'bg-brand' : 'bg-brand/50'}`}
                initial={{ height: 0 }}
                animate={{ height: totals[i] > 0 ? `${Math.max(4, (totals[i] / peak) * 100)}%` : 2 }}
                transition={{ duration: 0.5, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                style={totals[i] === 0 ? { background: 'var(--line)' } : undefined}
              />
              <span className="text-[10px] text-muted">{new Date(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8))).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="surface rounded-3xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">Sessions</h2>
          <button
            type="button"
            onClick={() => (confirming ? (clearLog(), setConfirming(false)) : setConfirming(true))}
            className={`text-sm ${confirming ? 'font-medium text-danger-line' : 'text-muted hover:text-ink'}`}
          >
            {confirming ? 'Click again to clear everything' : 'Clear history'}
          </button>
        </div>
        <ul className="space-y-4">
          {groups.map((g) => (
            <li key={g.date}>
              <p className="mb-1 flex justify-between text-sm font-medium">
                <span>{dayLabel(g.date, today)}</span>
                <span className="text-muted">{formatFocused(g.minutes)}</span>
              </p>
              <ul className="divide-y divide-line rounded-xl bg-page/60 px-3 text-sm">
                {g.entries.map((e) => (
                  <li key={e.id} className="flex justify-between gap-3 py-2">
                    <span className="min-w-0 truncate">{e.title}</span>
                    <span className="shrink-0 text-muted">{formatFocused(e.minutes)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { m } from 'motion/react';
import { useMemo } from 'react';
import { freeZonesFor, upNext } from '../lib/day';
import { formatDuration, fromMinutes, todayString } from '../lib/time';
import { useNowMinutes } from '../lib/useNow';
import { useTween } from '../lib/useTween';
import { usePlannerStore } from '../store/usePlannerStore';

function greetingFor(min: number): { lead: string; accent: string } {
  if (min < 12 * 60) return { lead: 'Good', accent: 'morning' };
  if (min < 17 * 60) return { lead: 'Good', accent: 'afternoon' };
  return { lead: 'Good', accent: 'evening' };
}

function dateParts(date: string): { weekday: string; rest: string } {
  const [y, mo, d] = date.split('-').map(Number);
  const dt = new Date(y, mo - 1, d);
  return {
    weekday: dt.toLocaleDateString(undefined, { weekday: 'long' }),
    rest: dt.toLocaleDateString(undefined, { day: 'numeric', month: 'long' }),
  };
}

/** A ring that fills as the day (or its task list) gets done. */
function Ring({ value, label, caption }: { value: number; label: string; caption: string }) {
  const r = 38;
  return (
    <div className="relative grid h-28 w-28 shrink-0 place-items-center" role="img" aria-label={`${label} ${caption}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
        <m.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="7"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0.001, Math.min(1, value)) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="text-center leading-tight">
        <div className="text-xl font-semibold tracking-tight">{label}</div>
        <div className="text-[11px] text-muted">{caption}</div>
      </div>
    </div>
  );
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
  const shownFree = Math.round(useTween(totalFree));
  const items = useMemo(() => upNext(anchors, tasks, date, isToday ? now : -1), [anchors, tasks, date, isToday, now]);

  const planned = tasks.filter((t) => t.status !== 'inbox' && t.date === date);
  const done = planned.filter((t) => t.status === 'done').length;
  const elapsed = isToday ? Math.max(0, Math.min(1, (now - dayStartMin) / (dayEndMin - dayStartMin))) : 0;
  const allDone = planned.length > 0 && done === planned.length;

  const ring =
    planned.length > 0
      ? { value: done / planned.length, label: `${done}/${planned.length}`, caption: 'tasks done' }
      : { value: elapsed, label: isToday ? `${Math.round(elapsed * 100)}%` : '–', caption: isToday ? 'of the day' : 'nothing planned' };

  const heading = isToday ? greetingFor(now) : { lead: '', accent: dateParts(date).weekday };

  const freeLine =
    zones.length === 0 ? (
      'No free time left in this day.'
    ) : (
      <>
        <span className="font-semibold text-ink">{formatDuration(shownFree)}</span> free across {zones.length}{' '}
        {zones.length === 1 ? 'gap' : 'gaps'}.
      </>
    );

  return (
    <m.section
      aria-label="Day overview"
      className="surface rounded-3xl p-6 sm:p-8"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="display text-5xl sm:text-6xl">
            {heading.lead && <>{heading.lead} </>}
            <span className="text-gradient">{heading.accent}</span>
            {!isToday && <span className="block text-3xl text-muted sm:text-4xl">{dateParts(date).rest}</span>}
          </h2>
          <p className="mt-4 text-base text-muted">{freeLine}</p>
          {allDone && (
            <m.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="shimmer mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
              Everything planned is done
            </m.p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <Ring {...ring} />
          <div className="min-w-[13rem] flex-1 rounded-2xl bg-page/70 p-4 ring-1 ring-line">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {isToday ? 'Up next' : 'First up'}
            </h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted">{isToday ? 'Nothing else today.' : 'Nothing scheduled.'}</p>
            ) : (
              <ul className="space-y-3">
                {items.map((i) => {
                  const underway = isToday && i.startMin <= now;
                  const progress = underway ? Math.min(1, (now - i.startMin) / (i.endMin - i.startMin)) : 0;
                  return (
                    <li key={i.id} className="flex gap-2.5">
                      <span className="w-1 shrink-0 rounded-full" style={{ backgroundColor: i.color }} />
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="flex items-center gap-2">
                          <span className="block truncate font-medium">{i.title}</span>
                          {underway && (
                            <span className="relative inline-flex h-2 w-2 shrink-0 text-brand pulse-dot" aria-label="Happening now">
                              <span className="h-2 w-2 rounded-full bg-brand" />
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted">
                          {underway ? 'Now · until ' : `${fromMinutes(i.startMin)}–`}
                          {fromMinutes(i.endMin)}
                        </span>
                        {underway && (
                          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line">
                            <m.span
                              className="block h-full rounded-full bg-brand"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress * 100}%` }}
                              transition={{ duration: 0.9, ease: 'easeOut' }}
                            />
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </m.section>
  );
}

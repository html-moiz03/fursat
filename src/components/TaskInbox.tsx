import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { checkFit, largestRoom, placedOn } from '../lib/fit';
import { computeGaps } from '../lib/gaps';
import { formatDuration, fromMinutes } from '../lib/time';
import { usePlannerStore } from '../store/usePlannerStore';

const PRESETS = [15, 30, 45, 60, 90, 120];
const MIN_DURATION = 5;
const MAX_DURATION = 600;

const field =
  'rounded-lg border border-line bg-page px-2 py-1.5 text-sm text-ink';

export function TaskInbox() {
  const tasks = usePlannerStore((s) => s.tasks);
  const anchors = usePlannerStore((s) => s.anchors);
  const settings = usePlannerStore((s) => s.settings);
  const date = usePlannerStore((s) => s.selectedDate);
  const addTask = usePlannerStore((s) => s.addTask);
  const removeTask = usePlannerStore((s) => s.removeTask);
  const planTask = usePlannerStore((s) => s.planTask);

  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('30');

  const { dayStartMin, dayEndMin, minGapMin } = settings;
  const gaps = useMemo(
    () => computeGaps(anchors, date, { dayStartMin, dayEndMin, minGapMin }),
    [anchors, date, dayStartMin, dayEndMin, minGapMin],
  );
  const placed = useMemo(() => placedOn(tasks, date), [tasks, date]);
  const inbox = tasks.filter((t) => t.status === 'inbox');

  const duration = Number(minutes);
  const durationValid = Number.isInteger(duration) && duration >= MIN_DURATION && duration <= MAX_DURATION;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !durationValid) return;
    addTask(title.trim(), duration);
    setTitle('');
  }

  function onPick(taskId: string, e: ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === '') return;
    planTask(taskId, date, Number(e.target.value));
  }

  return (
    <section className="space-y-3">
      <form onSubmit={onSubmit} className="space-y-3">
        <h2 className="text-base font-semibold">Add a task</h2>

        <label className="block text-sm">
          <span className="mb-1 block text-muted">What needs doing</span>
          <input
            className={`${field} w-full`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Study session, call the bank..."
          />
        </label>

        <div>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">How long (minutes)</span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_DURATION}
              max={MAX_DURATION}
              step={5}
              className={`${field} w-28`}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setMinutes(String(p))}
                className={`rounded-md border px-2 py-0.5 text-xs ${
                  duration === p
                    ? 'border-brand bg-brand text-on-brand'
                    : 'border-line'
                }`}
              >
                {formatDuration(p)}
              </button>
            ))}
          </div>
          {!durationValid && (
            <p className="mt-1 text-xs text-red-600">
              Enter a whole number of minutes from {MIN_DURATION} to {MAX_DURATION}.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!title.trim() || !durationValid}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-on-brand disabled:opacity-40"
        >
          Add to inbox
        </button>
      </form>

      <div>
        <h2 className="mb-2 text-base font-semibold">Inbox ({inbox.length})</h2>
        {inbox.length === 0 ? (
          <p className="text-sm text-muted">Nothing waiting. Add a task and place it in a free gap.</p>
        ) : (
          <ul className="space-y-2">
            {inbox.map((t) => {
              const fits = gaps.map((g) => ({ gap: g, result: checkFit(t.durationMin, g, placed) }));
              const fitCount = fits.filter((f) => f.result.fits).length;
              const shortfalls = fits.flatMap((f) => (f.result.fits ? [] : [f.result.shortfallMin]));

              let note: string;
              if (gaps.length === 0) note = 'No free time on this day.';
              else if (fitCount > 0) note = `Fits in ${fitCount} ${fitCount === 1 ? 'gap' : 'gaps'} today.`;
              else note = `Too long for every gap today. Closest is ${formatDuration(Math.min(...shortfalls))} short.`;

              return (
                <li
                  key={t.id}
                  className="space-y-1.5 rounded-xl border border-line px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-1">
                      <span className="font-medium">{t.title}</span>{' '}
                      <span className="text-muted">{formatDuration(t.durationMin)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTask(t.id)}
                      className="text-xs text-muted hover:text-red-600"
                      aria-label={`Delete ${t.title}`}
                    >
                      Delete
                    </button>
                  </div>

                  <p className={`text-xs ${fitCount > 0 ? 'text-brand' : 'text-amber-700'}`}>
                    {note}
                  </p>

                  {gaps.length > 0 && (
                    <select
                      className={`${field} w-full`}
                      value=""
                      onChange={(e) => onPick(t.id, e)}
                      aria-label={`Place ${t.title} in a gap`}
                    >
                      <option value="">Place in a gap...</option>
                      {fits.map(({ gap, result }) => (
                        <option key={gap.startMin} value={gap.startMin} disabled={!result.fits}>
                          {fromMinutes(gap.startMin)}–{fromMinutes(gap.endMin)}
                          {result.fits
                            ? ` · ${formatDuration(largestRoom(gap, placed))} room`
                            : ` · short by ${formatDuration(result.shortfallMin)}`}
                        </option>
                      ))}
                    </select>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

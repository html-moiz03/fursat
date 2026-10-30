import { useState, type FormEvent } from 'react';
import { toMinutes } from '../lib/time';
import { usePlannerStore } from '../store/usePlannerStore';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#2f6f5e', '#8a5a2b', '#9b4d5a', '#3d5a80', '#6b4e9b', '#5c6b2f'];

export function AnchorForm() {
  const addAnchor = usePlannerStore((s) => s.addAnchor);
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const count = usePlannerStore((s) => s.anchors.length);

  const [title, setTitle] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [days, setDays] = useState<number[]>([]);

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const sameTime = start === end;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || sameTime) return;
    addAnchor({
      title: title.trim(),
      startMin: toMinutes(start),
      endMin: toMinutes(end),
      repeatDays: days,
      // No repeat days selected: a one-off anchor on the day being viewed.
      date: days.length === 0 ? selectedDate : undefined,
      kind: 'other',
      color: COLORS[count % COLORS.length],
    });
    setTitle('');
    setDays([]);
  }

  const field =
    'rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-900';

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h2 className="text-base font-semibold">Add an anchor</h2>

      <label className="block text-sm">
        <span className="mb-1 block text-stone-600 dark:text-stone-400">Name</span>
        <input
          className={`${field} w-full`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Gym, commute, study..."
        />
      </label>

      <div className="flex gap-3">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-stone-600 dark:text-stone-400">Starts</span>
          <input type="time" className={`${field} w-full`} value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-stone-600 dark:text-stone-400">Ends</span>
          <input type="time" className={`${field} w-full`} value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm text-stone-600 dark:text-stone-400">
          Repeats on (leave empty for just {selectedDate})
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {DAY_LABELS.map((label, d) => (
            <button
              key={label}
              type="button"
              aria-pressed={days.includes(d)}
              onClick={() => toggleDay(d)}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                days.includes(d)
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-stone-300 dark:border-stone-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {sameTime && <p className="text-xs text-red-600">Start and end can't be the same time.</p>}
      <p className="text-xs text-stone-500">If the end is earlier than the start, the anchor runs past midnight.</p>

      <button
        type="submit"
        disabled={!title.trim() || sameTime}
        className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
      >
        Add anchor
      </button>
    </form>
  );
}

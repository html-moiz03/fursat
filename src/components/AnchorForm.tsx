import { useState, type FormEvent } from 'react';
import { fromMinutes, toMinutes } from '../lib/time';
import { usePlannerStore } from '../store/usePlannerStore';
import type { Anchor } from '../types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#4f7f70', '#8f6b47', '#a0606b', '#5a6f8f', '#7b6a95', '#6f7a48'];

type Props = {
  /** When given, the form edits this anchor instead of adding a new one. */
  anchor?: Anchor;
  onDone?: () => void;
};

export function AnchorForm({ anchor, onDone }: Props) {
  const addAnchor = usePlannerStore((s) => s.addAnchor);
  const updateAnchor = usePlannerStore((s) => s.updateAnchor);
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const count = usePlannerStore((s) => s.anchors.length);
  const editing = anchor !== undefined;
  const oneOffDate = anchor?.date ?? selectedDate;

  const [title, setTitle] = useState(anchor?.title ?? '');
  const [start, setStart] = useState(anchor ? fromMinutes(anchor.startMin) : '09:00');
  const [end, setEnd] = useState(anchor ? fromMinutes(anchor.endMin) : '10:00');
  const [days, setDays] = useState<number[]>(anchor?.repeatDays ?? []);

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const sameTime = start === end;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || sameTime) return;
    const fields = {
      title: title.trim(),
      startMin: toMinutes(start),
      endMin: toMinutes(end),
      repeatDays: days,
      // No repeat days selected: a one-off anchor on the day being viewed (or its own date when editing).
      date: days.length === 0 ? oneOffDate : undefined,
    };
    if (anchor) {
      updateAnchor(anchor.id, fields);
      onDone?.();
      return;
    }
    addAnchor({ ...fields, kind: 'other', color: COLORS[count % COLORS.length] });
    setTitle('');
    setDays([]);
  }

  const field =
    'rounded-lg border border-line bg-page px-2 py-1.5 text-sm text-ink';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-base font-semibold">{editing ? `Edit ${anchor.title}` : 'Add an anchor'}</h2>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Name</span>
        <input
          className={`${field} w-full`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Gym, commute, study..."
        />
      </label>

      <div className="flex gap-3">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-muted">Starts</span>
          <input type="time" className={`${field} w-full`} value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-muted">Ends</span>
          <input type="time" className={`${field} w-full`} value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm text-muted">
          Repeats on (leave empty for just {oneOffDate})
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
                  ? 'border-brand bg-brand text-on-brand'
                  : 'border-line'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {sameTime && <p className="text-xs text-red-600">Start and end can't be the same time.</p>}
      <p className="text-xs text-muted">If the end is earlier than the start, the anchor runs past midnight.</p>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!title.trim() || sameTime}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-on-brand disabled:opacity-40"
        >
          {editing ? 'Save changes' : 'Add anchor'}
        </button>
        {editing && (
          <button type="button" onClick={onDone} className="rounded-md border border-line px-3 py-1.5 text-sm text-muted">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

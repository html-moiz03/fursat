import { fromMinutes } from '../lib/time';
import { usePlannerStore } from '../store/usePlannerStore';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AnchorList() {
  const anchors = usePlannerStore((s) => s.anchors);
  const removeAnchor = usePlannerStore((s) => s.removeAnchor);

  return (
    <section>
      <h2 className="mb-2 text-base font-semibold">Your anchors</h2>
      {anchors.length === 0 ? (
        <p className="text-sm text-muted">No anchors yet, so the whole day is free.</p>
      ) : (
        <ul className="space-y-1.5">
          {anchors.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-sm"
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
              <span className="flex-1">
                <span className="font-medium">{a.title}</span>{' '}
                <span className="text-muted">
                  {fromMinutes(a.startMin)}–{fromMinutes(a.endMin)} ·{' '}
                  {a.repeatDays.length === 7
                    ? 'daily'
                    : a.repeatDays.length > 0
                      ? a.repeatDays.map((d) => DAY_LABELS[d]).join(', ')
                      : (a.date ?? 'one-off')}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeAnchor(a.id)}
                className="text-xs text-muted hover:text-red-600"
                aria-label={`Delete ${a.title}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { useState } from 'react';
import { overdueTasks } from '../lib/carryOver';
import { nowMinutes, todayString } from '../lib/time';
import { useNowMinutes } from '../lib/useNow';
import { usePlannerStore } from '../store/usePlannerStore';

/**
 * Shown above the timeline when tasks planned for earlier days were never ticked off.
 * They can be moved into what is left of today, or sent back to the inbox.
 */
export function CarryOverNotice() {
  const tasks = usePlannerStore((s) => s.tasks);
  const carryOverdue = usePlannerStore((s) => s.carryOverdue);
  const inboxOverdue = usePlannerStore((s) => s.inboxOverdue);
  const now = useNowMinutes();
  const [result, setResult] = useState<string | null>(null);

  const today = todayString();
  const overdue = overdueTasks(tasks, today);

  if (overdue.length === 0 && !result) return null;

  if (overdue.length === 0) {
    return (
      <div role="status" className="mb-4 flex items-center gap-3 rounded-xl bg-brand-soft px-4 py-3 text-sm">
        <p className="flex-1">{result}</p>
        <button type="button" onClick={() => setResult(null)} className="text-muted hover:text-ink" aria-label="Dismiss">
          ×
        </button>
      </div>
    );
  }

  function moveToToday() {
    // Round up to the next 5 minutes so a task never starts in the past.
    const from = Math.ceil(Math.max(now, nowMinutes()) / 5) * 5;
    const { moved, inbox } = carryOverdue(todayString(), from);
    const parts = [];
    if (moved > 0) parts.push(`${moved} moved to today`);
    if (inbox > 0) parts.push(`${inbox} had no room left today and went to the inbox`);
    const text = parts.join(', ');
    setResult(text.charAt(0).toUpperCase() + text.slice(1) + '.');
  }

  function backToInbox() {
    const n = inboxOverdue(todayString());
    setResult(`${n} sent back to the inbox.`);
  }

  return (
    <div role="status" className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="min-w-0 flex-1">
        {overdue.length} unfinished {overdue.length === 1 ? 'task' : 'tasks'} from earlier days:{' '}
        <span className="font-medium">{overdue.map((t) => t.title).join(', ')}</span>
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={moveToToday} className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-on-brand">
          Move to today
        </button>
        <button type="button" onClick={backToInbox} className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm">
          Back to inbox
        </button>
      </div>
    </div>
  );
}

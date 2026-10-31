import { dayTotals, formatFocused } from '../lib/focusLog';
import { formatDuration } from '../lib/time';
import { useFocus } from '../store/useFocus';
import { usePlannerStore } from '../store/usePlannerStore';

/** One line: how much of the day is planned and how much is already done. */
export function DaySummary() {
  const tasks = usePlannerStore((s) => s.tasks);
  const date = usePlannerStore((s) => s.selectedDate);
  const log = useFocus((s) => s.log);
  const focusedMin = dayTotals(log, [date])[0];

  const todays = tasks.filter((t) => t.status !== 'inbox' && t.date === date);
  if (todays.length === 0) return null;

  const plannedMin = todays.reduce((sum, t) => sum + t.durationMin, 0);
  const done = todays.filter((t) => t.status === 'done');
  const doneMin = done.reduce((sum, t) => sum + t.durationMin, 0);

  return (
    <p className="mb-3 text-sm text-muted">
      Planned {formatDuration(plannedMin)} across {todays.length} {todays.length === 1 ? 'task' : 'tasks'}
      {' · '}
      {done.length} done ({formatDuration(doneMin)})
      {focusedMin > 0 && <> · <span className="font-medium text-brand">{formatFocused(focusedMin)} focused</span></>}
    </p>
  );
}

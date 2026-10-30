import type { Task } from '../types';
import { fromMinutes } from '../lib/time';
import { usePlannerStore } from '../store/usePlannerStore';

type Props = {
  task: Task;
  top: number;
  height: number;
  /** The task no longer sits in free time, e.g. an anchor was added over it. */
  conflict: boolean;
};

export function TaskBlock({ task, top, height, conflict }: Props) {
  const toggleDone = usePlannerStore((s) => s.toggleDone);
  const unplanTask = usePlannerStore((s) => s.unplanTask);

  const done = task.status === 'done';
  const start = task.startMin ?? 0;
  const range = `${fromMinutes(start)}–${fromMinutes(start + task.durationMin)}`;

  const colors = conflict
    ? 'border-red-500 bg-red-100 text-red-900'
    : 'border-sky-600 bg-sky-100 text-sky-900';

  return (
    <div
      className={`absolute left-4 right-4 z-[5] flex items-center gap-2 overflow-hidden rounded-md border px-2 text-xs leading-none ${colors}`}
      style={{ top, height }}
      title={`${task.title}, ${range}${conflict ? ' (overlaps something else)' : ''}`}
    >
      <input
        type="checkbox"
        checked={done}
        onChange={() => toggleDone(task.id)}
        aria-label={`Mark ${task.title} as done`}
      />
      <span className={`min-w-0 flex-1 truncate ${done ? 'line-through opacity-60' : ''}`}>{task.title}</span>
      <span className="shrink-0 text-[11px] opacity-80">
        {conflict ? 'Conflict · ' : ''}
        {range}
      </span>
      <button
        type="button"
        onClick={() => unplanTask(task.id)}
        aria-label={`Move ${task.title} back to the inbox`}
        className="shrink-0 px-1 text-sm opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

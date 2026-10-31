import { useDraggable } from '@dnd-kit/core';
import { m } from 'motion/react';
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

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const done = task.status === 'done';
  const start = task.startMin ?? 0;
  const range = `${fromMinutes(start)}–${fromMinutes(start + task.durationMin)}`;

  const colors = conflict
    ? 'border-danger-line bg-danger text-danger-ink'
    : 'border-task-line bg-task text-task-ink';

  return (
    <m.div
      ref={setNodeRef}
      className={`absolute left-4 right-4 z-[5] flex items-center gap-2 overflow-hidden rounded-lg border px-2 text-xs leading-none shadow-sm ${colors}`}
      initial={{ opacity: 0, scale: 0.9, top, height }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1, top, height }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      title={`${task.title}, ${range}${conflict ? ' (overlaps something else)' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${task.title} to another gap`}
        className="-ml-1 shrink-0 cursor-grab touch-none px-0.5 opacity-60 hover:opacity-100"
      >
        ⠿
      </button>
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
    </m.div>
  );
}

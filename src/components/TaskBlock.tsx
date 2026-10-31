import { useDraggable } from '@dnd-kit/core';
import { m } from 'motion/react';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Task } from '../types';
import { useKeyboardMove } from '../lib/useKeyboardMove';
import { formatDuration, fromMinutes } from '../lib/time';
import { useFocus } from '../store/useFocus';
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
  const startFocus = useFocus((s) => s.start);
  const setMinimized = useFocus((s) => s.setMinimized);
  const resizeTask = usePlannerStore((s) => s.resizeTask);
  const { lifted, gripRef, onKeyDown, onBlur } = useKeyboardMove(task.id);
  const [resizing, setResizing] = useState(false);
  const grab = useRef<{ y: number; min: number } | null>(null);
  const focusing = useFocus((s) => s.session?.taskId === task.id);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const done = task.status === 'done';
  const start = task.startMin ?? 0;
  const range = `${fromMinutes(start)}–${fromMinutes(start + task.durationMin)}`;

  const colors = conflict
    ? 'border-danger-line bg-danger text-danger-ink'
    : 'border-task-line bg-task text-task-ink';

  function onResizeDown(e: PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = { y: e.clientY, min: task.durationMin };
    setResizing(true);
  }
  function onResizeMove(e: PointerEvent<HTMLDivElement>) {
    // The timeline is one pixel per minute, so the pointer's travel is the change in minutes.
    if (grab.current) resizeTask(task.id, grab.current.min + (e.clientY - grab.current.y));
  }
  function onResizeEnd() {
    grab.current = null;
    setResizing(false);
  }
  function onResizeKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    resizeTask(task.id, task.durationMin + (e.key === 'ArrowDown' ? 5 : -5));
  }

  return (
    <m.div
      ref={setNodeRef}
      className={`absolute left-4 right-4 z-[5] flex items-center gap-2 overflow-hidden rounded-lg border px-2 text-xs leading-none shadow-sm ${colors} ${lifted ? 'ring-2 ring-brand' : ''}`}
      initial={{ opacity: 0, scale: 0.9, top, height }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1, top, height }}
      transition={resizing ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
      title={`${task.title}, ${range}${conflict ? ' (overlaps something else)' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${task.title} to another gap, or press Space to move it with the arrow keys (left and right change the day)`}
        ref={gripRef}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={`-ml-1 shrink-0 cursor-grab touch-none px-0.5 hover:opacity-100 ${lifted ? 'text-brand opacity-100' : 'opacity-60'}`}
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
      {!done && (
        <button
          type="button"
          onClick={() => (focusing ? setMinimized(false) : startFocus(task))}
          aria-label={focusing ? `Open the focus timer for ${task.title}` : `Start a focus timer for ${task.title}`}
          title={focusing ? 'Open focus timer' : 'Start focus timer'}
          className={`shrink-0 px-1 ${focusing ? 'text-brand opacity-100' : 'opacity-70 hover:opacity-100'}`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="m7 4 13 8-13 8Z" />
          </svg>
        </button>
      )}
      <button
        type="button"
        onClick={() => unplanTask(task.id)}
        aria-label={`Move ${task.title} back to the inbox`}
        className="shrink-0 px-1 text-sm opacity-70 hover:opacity-100"
      >
        ×
      </button>
      {!conflict && (
        <div
          role="slider"
          tabIndex={0}
          aria-label={`Length of ${task.title}`}
          aria-orientation="vertical"
          aria-valuemin={5}
          aria-valuenow={task.durationMin}
          aria-valuetext={formatDuration(task.durationMin)}
          title="Drag to change the length (or use the up and down arrow keys)"
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
          onKeyDown={onResizeKey}
          className="group absolute inset-x-0 bottom-0 flex h-2 cursor-ns-resize touch-none items-end justify-center focus-visible:outline-2"
        >
          <span className={`mb-px h-0.5 w-8 rounded-full bg-current transition-opacity ${resizing ? 'opacity-70' : 'opacity-0 group-hover:opacity-50 group-focus-visible:opacity-70'}`} />
        </div>
      )}
    </m.div>
  );
}

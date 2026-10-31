import { useEffect, useRef, type FocusEvent, type KeyboardEvent } from 'react';
import { useCarry } from '../store/useCarry';
import { usePlannerStore } from '../store/usePlannerStore';
import { useToasts } from '../store/useToasts';
import { formatDuration, fromMinutes, addDays, nowMinutes, todayString } from './time';
import { firstStart } from './week';

const dayName = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
};

/**
 * Keyboard moving for a placed task's grip. Space or Enter picks it up; up and down step it through
 * the free spots of its day, left and right move it to the previous or next day; Enter drops it and
 * Escape puts it back. Returns what to spread on the grip button.
 */
export function useKeyboardMove(taskId: string) {
  const lifted = useCarry((s) => s.id === taskId);
  const gripRef = useRef<HTMLButtonElement>(null);

  // Moving to another day remounts the block; the new one takes the keyboard over from the old.
  useEffect(() => {
    if (useCarry.getState().id === taskId) gripRef.current?.focus();
  }, [taskId]);

  const find = () => usePlannerStore.getState().tasks.find((t) => t.id === taskId);
  const say = (msg: string) => useCarry.getState().say(msg);
  const warn = (msg: string) => {
    say(msg);
    useToasts.getState().show(msg, 'warn');
  };
  const where = () => {
    const t = find();
    return t && t.date !== undefined && t.startMin !== undefined
      ? `${dayName(t.date)}, ${fromMinutes(t.startMin)}–${fromMinutes(t.startMin + t.durationMin)}`
      : '';
  };

  function moveDay(dir: 1 | -1) {
    const store = usePlannerStore.getState();
    const task = find();
    if (!task || task.date === undefined || task.startMin === undefined) return;
    const date = addDays(task.date, dir);
    const today = todayString();
    if (date < today) return warn('That day is in the past.');
    // Same time of day if it fits, otherwise the earliest room that day.
    const placed =
      store.planTask(task.id, date, task.startMin) ||
      store.planTaskOnDay(task.id, date, firstStart(date, today, nowMinutes(), store.settings.dayStartMin));
    if (!placed) return warn(`No room for ${formatDuration(task.durationMin)} on ${dayName(date)}.`);
    store.setSelectedDate(date);
    say(`Moved to ${where()}`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const carry = useCarry.getState();
    const task = find();
    if (!task) return;

    if (carry.id !== taskId) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        carry.lift(taskId, task.date !== undefined && task.startMin !== undefined ? { date: task.date, startMin: task.startMin } : null);
        say(`Picked up ${task.title}, ${where()}. Arrows move it, Enter drops it, Escape cancels.`);
      }
      return;
    }

    // While carrying, the task owns the keyboard, so letters and arrows don't also trigger shortcuts.
    e.stopPropagation();
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const moved = usePlannerStore.getState().nudgeTask(taskId, e.key === 'ArrowDown' ? 1 : -1);
      if (moved === null) warn('No other free spot that way.');
      else {
        say(`Moved to ${where()}`);
        const el = e.currentTarget;
        window.requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest' }));
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      moveDay(e.key === 'ArrowRight' ? 1 : -1);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      carry.release();
      say(`Dropped ${task.title}, ${where()}.`);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      const o = carry.origin;
      if (o) {
        const store = usePlannerStore.getState();
        store.planTask(taskId, o.date, o.startMin);
        store.setSelectedDate(o.date);
      }
      carry.release();
      say(`Cancelled. ${task.title} is back where it was.`);
    }
  }

  // Tabbing to something else drops the task where it is. (A remount has no next element, so it is not a drop.)
  function onBlur(e: FocusEvent<HTMLButtonElement>) {
    if (e.relatedTarget && useCarry.getState().id === taskId) useCarry.getState().release();
  }

  return { lifted, gripRef, onKeyDown, onBlur };
}

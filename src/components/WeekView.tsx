import { useDraggable, useDroppable } from '@dnd-kit/core';
import { m } from 'motion/react';
import { useMemo } from 'react';
import { dayTotals, formatFocused } from '../lib/focusLog';
import { formatDuration, fromMinutes, nowMinutes, todayString } from '../lib/time';
import { dayOverview, firstStart, slotOnDay, weekDates, type DayOverview } from '../lib/week';
import { useFocus } from '../store/useFocus';
import { usePlannerStore } from '../store/usePlannerStore';
import { useActiveTask } from './PlannerDnd';

function dayParts(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return {
    weekday: dt.toLocaleDateString(undefined, { weekday: 'short' }),
    day: dt.getDate(),
    month: dt.toLocaleDateString(undefined, { month: 'short' }),
  };
}

const grip =
  'shrink-0 cursor-grab touch-none rounded px-0.5 text-muted opacity-70 hover:bg-card hover:opacity-100';

/** A planned task in a day column. Drag it by the grip to another day. */
function TaskItem({ item }: { item: DayOverview['items'][number] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  return (
    <li
      ref={setNodeRef}
      className={`flex min-w-0 items-start gap-1 rounded-md border-l-4 bg-page px-1.5 py-1 text-xs ${isDragging ? 'opacity-40' : ''}`}
      style={{ borderLeftColor: item.color }}
      title={`${item.title}, ${fromMinutes(item.startMin)}–${fromMinutes(item.endMin)}`}
    >
      <button type="button" {...attributes} {...listeners} aria-label={`Drag ${item.title} to another day`} className={grip}>
        ⠿
      </button>
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-medium ${item.done ? 'line-through opacity-60' : ''}`}>{item.title}</span>
        <span className="block text-muted">
          {fromMinutes(item.startMin)}–{fromMinutes(item.endMin)}
        </span>
      </span>
    </li>
  );
}

/** An inbox task, waiting to be dropped on a day. */
function InboxChip({ id, title, durationMin }: { id: string; title: string; durationMin: number }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <li
      ref={setNodeRef}
      className={`flex items-center gap-1 rounded-full bg-card py-1 pl-1.5 pr-3 text-sm ring-1 ring-line ${isDragging ? 'opacity-40' : ''}`}
    >
      <button type="button" {...attributes} {...listeners} aria-label={`Drag ${title} onto a day`} className={grip}>
        ⠿
      </button>
      <span className="font-medium">{title}</span>
      <span className="text-muted">{formatDuration(durationMin)}</span>
    </li>
  );
}

type ColumnProps = { overview: DayOverview; focusedMin: number; index: number; isToday: boolean; isPast: boolean; onOpenDay: (date: string) => void };

/** One day. While a task is dragged it says whether the task fits and accepts the drop. */
function DayColumn({ overview: d, focusedMin, index, isToday, isPast, onOpenDay }: ColumnProps) {
  const active = useActiveTask();
  const anchors = usePlannerStore((s) => s.anchors);
  const tasks = usePlannerStore((s) => s.tasks);
  const settings = usePlannerStore((s) => s.settings);
  const { setNodeRef, isOver } = useDroppable({ id: `day-${d.date}`, data: { day: d.date }, disabled: isPast });

  const { weekday, day, month } = dayParts(d.date);

  let slot: number | null = null;
  if (active && !isPast) {
    const from = firstStart(d.date, todayString(), nowMinutes(), settings.dayStartMin);
    slot = slotOnDay(active, anchors, tasks, d.date, from, settings);
  }
  const fits = slot !== null;
  const slotLabel = slot === null ? '' : fromMinutes(slot);

  let ring = isToday ? 'ring-2 ring-brand' : 'ring-1 ring-line';
  let hint: string | null = null;
  if (active && isPast) {
    ring = 'ring-1 ring-line opacity-60';
    hint = 'Past day';
  } else if (active && fits) {
    ring = isOver ? 'ring-2 ring-brand bg-brand-soft' : 'ring-1 ring-brand/60';
    hint = isOver ? `Drop to place at ${slotLabel}` : `Fits · from ${slotLabel}`;
  } else if (active) {
    ring = 'ring-1 ring-line opacity-60';
    hint = `No room for ${formatDuration(active.durationMin)}`;
  }

  return (
    <m.li
      ref={setNodeRef}
      className={`flex min-w-0 flex-col rounded-2xl bg-card p-3 backdrop-blur-md transition-shadow ${ring}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={active ? undefined : { y: -3 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={() => onOpenDay(d.date)}
        aria-label={`Open ${weekday} ${day} ${month}`}
        className="mb-2 block w-full rounded-lg text-left hover:bg-brand-soft"
      >
        <span className={`block text-xs font-medium uppercase tracking-wide ${isToday ? 'text-brand' : 'text-muted'}`}>
          {weekday}
        </span>
        <span className="block text-lg font-semibold leading-tight">
          {day} <span className="text-sm font-normal text-muted">{month}</span>
        </span>
        <span className="block text-xs text-muted">{formatDuration(d.freeMin)} free</span>
        {focusedMin > 0 && <span className="block text-xs font-medium text-brand">{formatFocused(focusedMin)} focused</span>}
      </button>

      {hint && <p className={`mb-2 text-xs font-medium ${fits ? 'text-brand' : 'text-muted'}`}>{hint}</p>}

      {d.items.length === 0 ? (
        <p className="text-xs text-muted">Nothing fixed or planned.</p>
      ) : (
        <ul className="space-y-1.5">
          {d.items.map((item) =>
            item.kind === 'task' ? (
              <TaskItem key={item.id} item={item} />
            ) : (
              <li
                key={item.id}
                className="min-w-0 rounded-md border-l-4 bg-page px-2 py-1 text-xs"
                style={{ borderLeftColor: item.color }}
                title={`${item.title}, ${fromMinutes(item.startMin)}–${fromMinutes(item.endMin)}`}
              >
                <span className="block truncate font-medium">{item.title}</span>
                <span className="block text-muted">
                  {fromMinutes(item.startMin)}–{fromMinutes(item.endMin)}
                </span>
              </li>
            ),
          )}
        </ul>
      )}
    </m.li>
  );
}

/** Seven days side by side: what is fixed, what is planned, and how much time is left. Tasks can be dragged between days. */
export function WeekView({ onOpenDay }: { onOpenDay: (date: string) => void }) {
  const anchors = usePlannerStore((s) => s.anchors);
  const tasks = usePlannerStore((s) => s.tasks);
  const settings = usePlannerStore((s) => s.settings);
  const selected = usePlannerStore((s) => s.selectedDate);
  const { dayStartMin, dayEndMin, minGapMin } = settings;
  const today = todayString();

  const days = useMemo(
    () => weekDates(selected).map((date) => dayOverview(anchors, tasks, date, { dayStartMin, dayEndMin, minGapMin })),
    [anchors, tasks, selected, dayStartMin, dayEndMin, minGapMin],
  );
  const log = useFocus((s) => s.log);
  const focused = useMemo(() => dayTotals(log, days.map((d) => d.date)), [log, days]);
  const totalFocused = focused.reduce((sum, n) => sum + n, 0);
  const inbox = tasks.filter((t) => t.status === 'inbox');

  const totalFree = days.reduce((sum, d) => sum + d.freeMin, 0);
  const totalPlanned = days.reduce((sum, d) => sum + d.plannedMin, 0);

  return (
    <section aria-label="Week overview">
      <p className="mb-4 text-sm text-muted">
        {formatDuration(totalFree)} free this week · {formatDuration(totalPlanned)} planned
        {totalFocused > 0 && <> · <span className="font-medium text-brand">{formatFocused(totalFocused)} focused</span></>}
      </p>

      <div className="mb-4 rounded-2xl bg-card p-3 ring-1 ring-line">
        {inbox.length === 0 ? (
          <p className="text-sm text-muted">Inbox is empty. Add tasks on Today, then drag them onto a day here.</p>
        ) : (
          <>
            <p className="mb-2 text-sm text-muted">Inbox · drag a task onto a day</p>
            <ul className="flex flex-wrap gap-2">
              {inbox.map((t) => (
                <InboxChip key={t.id} id={t.id} title={t.title} durationMin={t.durationMin} />
              ))}
            </ul>
          </>
        )}
      </div>

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {days.map((d, i) => (
          <DayColumn key={d.date} overview={d} focusedMin={focused[i]} index={i} isToday={d.date === today} isPast={d.date < today} onOpenDay={onOpenDay} />
        ))}
      </ul>
    </section>
  );
}

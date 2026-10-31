import { MIN_WINDOW, WINDOW_OPTIONS, tasksOutside, timeLabel } from '../lib/dayWindow';
import { usePlannerStore } from '../store/usePlannerStore';

const field = 'w-full rounded-lg border border-line bg-page px-2 py-1.5 text-sm text-ink';

export function DayHoursCard() {
  const { dayStartMin, dayEndMin } = usePlannerStore((s) => s.settings);
  const tasks = usePlannerStore((s) => s.tasks);
  const updateSettings = usePlannerStore((s) => s.updateSettings);

  const outside = tasksOutside(tasks, { dayStartMin, dayEndMin }).length;

  return (
    <section aria-label="Day hours" className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Day hours</h2>
        <p className="mt-1 text-sm text-muted">
          Fursat shows and plans inside these hours. Widen them to fit an early Fajr or a late evening.
        </p>
      </div>

      <div className="flex gap-3">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-muted">Day starts</span>
          <select
            className={field}
            value={dayStartMin}
            onChange={(e) => updateSettings({ dayStartMin: Number(e.target.value) })}
          >
            {WINDOW_OPTIONS.filter((m) => m < 1440).map((m) => (
              <option key={m} value={m} disabled={m > dayEndMin - MIN_WINDOW}>
                {timeLabel(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-muted">Day ends</span>
          <select
            className={field}
            value={dayEndMin}
            onChange={(e) => updateSettings({ dayEndMin: Number(e.target.value) })}
          >
            {WINDOW_OPTIONS.filter((m) => m > 0).map((m) => (
              <option key={m} value={m} disabled={m < dayStartMin + MIN_WINDOW}>
                {timeLabel(m)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {outside > 0 && (
        <p role="status" className="text-sm text-warn-ink">
          {outside} placed {outside === 1 ? 'task is' : 'tasks are'} outside these hours, so{' '}
          {outside === 1 ? 'it is' : 'they are'} only partly shown or hidden.
        </p>
      )}
    </section>
  );
}

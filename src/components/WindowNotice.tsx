import { suggestWindow, timeLabel } from '../lib/dayWindow';
import { fromMinutes } from '../lib/time';
import { usePlannerStore } from '../store/usePlannerStore';

/** Shown above the timeline when a prayer of the selected day falls outside the day hours. */
export function WindowNotice() {
  const anchors = usePlannerStore((s) => s.anchors);
  const date = usePlannerStore((s) => s.selectedDate);
  const { dayStartMin, dayEndMin } = usePlannerStore((s) => s.settings);
  const updateSettings = usePlannerStore((s) => s.updateSettings);

  const suggestion = suggestWindow(anchors, date, { dayStartMin, dayEndMin });
  if (!suggestion) return null;

  const early = suggestion.early.map((a) => `${a.title} (${fromMinutes(a.startMin)})`).join(', ');
  const late = suggestion.late.map((a) => `${a.title} (${fromMinutes(a.startMin)})`).join(', ');

  return (
    <div role="status" className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-brand-soft px-4 py-3 text-sm">
      <p className="min-w-0 flex-1">
        {early && (
          <>
            {early} starts before your day begins at {timeLabel(dayStartMin)}.{' '}
          </>
        )}
        {late && (
          <>
            {late} runs past your day's end at {timeLabel(dayEndMin)}.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={() => updateSettings({ dayStartMin: suggestion.dayStartMin, dayEndMin: suggestion.dayEndMin })}
        className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-on-brand"
      >
        Show it ({timeLabel(suggestion.dayStartMin)}–{timeLabel(suggestion.dayEndMin)})
      </button>
    </div>
  );
}

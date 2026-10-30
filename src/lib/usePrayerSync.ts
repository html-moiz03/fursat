import { useEffect } from 'react';
import { fetchMonth, prayerAnchors } from './aladhan';
import { usePlannerStore } from '../store/usePlannerStore';
import { usePrayerStatus } from '../store/usePrayerStatus';

/**
 * Keeps prayer anchors in step with what is on screen: when prayer times are on and a
 * month shown has none yet, fetch it. Months already fetched are kept, so they still work offline.
 *
 * The month of the selected day is always synced. `extraDate` covers a second month, for a
 * week that crosses a month boundary.
 */
export function usePrayerSync(extraDate?: string) {
  const selectedMonth = usePlannerStore((s) => s.selectedDate.slice(0, 7));
  const extraMonth = extraDate && extraDate.slice(0, 7) !== selectedMonth ? extraDate.slice(0, 7) : null;
  useMonthSync(selectedMonth, true);
  useMonthSync(extraMonth, false);
}

/** `report` decides whether this month drives the loading and error status shown on the Anchors page. */
function useMonthSync(month: string | null, report: boolean) {
  const prayer = usePlannerStore((s) => s.settings.prayer);
  const hasMonth = usePlannerStore((s) =>
    month === null ? true : s.anchors.some((a) => a.source === 'prayer-api' && a.date?.startsWith(month)),
  );
  const addPrayerAnchors = usePlannerStore((s) => s.addPrayerAnchors);
  const retry = usePrayerStatus((s) => s.retry);
  const setStatus = usePrayerStatus((s) => s.set);

  const enabled = !!prayer?.enabled && !!prayer.city.trim() && !!prayer.country.trim();
  const city = prayer?.city ?? '';
  const country = prayer?.country ?? '';
  const method = prayer?.method ?? 1;
  const school = prayer?.school ?? 1;
  const durationMin = prayer?.durationMin ?? 20;

  useEffect(() => {
    if (month === null) return;
    if (!enabled) {
      if (report) setStatus('idle');
      return;
    }
    if (hasMonth) {
      if (report) setStatus('ready');
      return;
    }

    let cancelled = false;
    if (report) setStatus('loading');
    const [year, monthNumber] = month.split('-').map(Number);
    fetchMonth({ year, month: monthNumber, city, country, method, school })
      .then((days) => {
        if (cancelled) return;
        addPrayerAnchors(month, prayerAnchors(days, durationMin));
      })
      .catch((err: unknown) => {
        if (cancelled || !report) return;
        setStatus('error', err instanceof Error ? err.message : 'Could not load prayer times.');
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, hasMonth, month, report, city, country, method, school, durationMin, retry, addPrayerAnchors, setStatus]);
}

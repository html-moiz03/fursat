import { useEffect } from 'react';
import { fetchMonth, prayerAnchors } from './aladhan';
import { usePlannerStore } from '../store/usePlannerStore';
import { usePrayerStatus } from '../store/usePrayerStatus';

/**
 * Keeps prayer anchors in step with the month on screen: when prayer times are on and
 * that month has none yet, fetch it. Months already fetched are kept, so they still work offline.
 */
export function usePrayerSync() {
  const prayer = usePlannerStore((s) => s.settings.prayer);
  const month = usePlannerStore((s) => s.selectedDate.slice(0, 7));
  const hasMonth = usePlannerStore((s) =>
    s.anchors.some((a) => a.source === 'prayer-api' && a.date?.startsWith(s.selectedDate.slice(0, 7))),
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
    if (!enabled) {
      setStatus('idle');
      return;
    }
    if (hasMonth) {
      setStatus('ready');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    const [year, monthNumber] = month.split('-').map(Number);
    fetchMonth({ year, month: monthNumber, city, country, method, school })
      .then((days) => {
        if (cancelled) return;
        addPrayerAnchors(month, prayerAnchors(days, durationMin));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error', err instanceof Error ? err.message : 'Could not load prayer times.');
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, hasMonth, month, city, country, method, school, durationMin, retry, addPrayerAnchors, setStatus]);
}

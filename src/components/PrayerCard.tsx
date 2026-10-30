import { useState, type FormEvent } from 'react';
import { DEFAULT_PRAYER, usePlannerStore } from '../store/usePlannerStore';
import { usePrayerStatus } from '../store/usePrayerStatus';

const METHODS: [number, string][] = [
  [1, 'University of Islamic Sciences, Karachi'],
  [2, 'ISNA (North America)'],
  [3, 'Muslim World League'],
  [4, 'Umm al-Qura, Makkah'],
  [5, 'Egyptian General Authority'],
  [8, 'Gulf Region'],
  [13, 'Diyanet, Turkey'],
  [15, 'Moonsighting Committee'],
  [17, 'JAKIM, Malaysia'],
  [20, 'KEMENAG, Indonesia'],
];
const DURATIONS = [10, 15, 20, 30, 45];

const field = 'w-full rounded-lg border border-line bg-page px-2 py-1.5 text-sm text-ink';

export function PrayerCard() {
  const saved = usePlannerStore((s) => s.settings.prayer) ?? DEFAULT_PRAYER;
  const setPrayerSettings = usePlannerStore((s) => s.setPrayerSettings);
  const { status, message, bumpRetry } = usePrayerStatus();

  const [city, setCity] = useState(saved.city);
  const [country, setCountry] = useState(saved.country);
  const [method, setMethod] = useState(saved.method);
  const [school, setSchool] = useState<0 | 1>(saved.school);
  const [durationMin, setDurationMin] = useState(saved.durationMin);

  const valid = city.trim() !== '' && country.trim() !== '';

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setPrayerSettings({ enabled: true, city: city.trim(), country: country.trim(), method, school, durationMin });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Prayer times">
      <div>
        <h2 className="text-base font-semibold">Prayer times</h2>
        <p className="mt-1 text-sm text-muted">
          Adds Fajr, Dhuhr, Asr, Maghrib and Isha as anchors, so they are never counted as free time.
        </p>
      </div>

      <div className="flex gap-3">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-muted">City</span>
          <input className={field} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Rawalpindi" />
        </label>
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-muted">Country</span>
          <input className={field} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Pakistan" />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Calculation method</span>
        <select className={field} value={method} onChange={(e) => setMethod(Number(e.target.value))}>
          {METHODS.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-3">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-muted">Asr</span>
          <select className={field} value={school} onChange={(e) => setSchool(Number(e.target.value) as 0 | 1)}>
            <option value={1}>Hanafi</option>
            <option value={0}>Standard (Shafi'i, Maliki, Hanbali)</option>
          </select>
        </label>
        <label className="block w-28 text-sm">
          <span className="mb-1 block text-muted">Blocks off</span>
          <select className={field} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!valid}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-on-brand disabled:opacity-40"
        >
          {saved.enabled ? 'Update prayer times' : 'Add prayer times'}
        </button>
        {saved.enabled && (
          <button
            type="button"
            onClick={() => setPrayerSettings({ enabled: false })}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-red-600"
          >
            Turn off
          </button>
        )}
      </div>

      {saved.enabled && status === 'loading' && (
        <p role="status" className="text-sm text-muted">
          Loading prayer times for {saved.city}...
        </p>
      )}
      {saved.enabled && status === 'ready' && (
        <p role="status" className="text-sm text-brand">
          On for {saved.city}, {saved.country}. Other months load as you open them.
        </p>
      )}
      {saved.enabled && status === 'error' && (
        <p role="alert" className="text-sm text-red-600">
          {message}{' '}
          <button type="button" onClick={bumpRetry} className="underline">
            Try again
          </button>
        </p>
      )}

      <p className="text-xs text-muted">Times come from the AlAdhan API, which receives the city and country you enter.</p>
    </form>
  );
}

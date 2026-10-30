import { AnchorForm } from './components/AnchorForm';
import { AnchorList } from './components/AnchorList';
import { Timeline } from './components/Timeline';
import { addDays, todayString } from './lib/time';
import { usePlannerStore } from './store/usePlannerStore';

function prettyDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function App() {
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate);

  const navButton =
    'rounded-md border border-stone-300 px-2.5 py-1 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">
            Fursat <span className="font-normal text-stone-500">Day Planner</span>
          </h1>
          <div className="flex items-center gap-2">
            <button className={navButton} onClick={() => setSelectedDate(addDays(selectedDate, -1))} aria-label="Previous day">
              ←
            </button>
            <button className={navButton} onClick={() => setSelectedDate(todayString())}>
              Today
            </button>
            <button className={navButton} onClick={() => setSelectedDate(addDays(selectedDate, 1))} aria-label="Next day">
              →
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h2 className="mb-1 text-xl font-semibold">{prettyDate(selectedDate)}</h2>
          <Timeline />
        </div>
        <aside className="space-y-8">
          <AnchorForm />
          <AnchorList />
        </aside>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { AnchorForm } from './components/AnchorForm';
import { AnchorList } from './components/AnchorList';
import { Card } from './components/Card';
import { DaySummary } from './components/DaySummary';
import { Greeting } from './components/Greeting';
import { MonthCalendar } from './components/MonthCalendar';
import { Sidebar, type View } from './components/Sidebar';
import { TaskInbox } from './components/TaskInbox';
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
  const [view, setView] = useState<View>('today');
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate);

  const navButton =
    'rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-ink hover:bg-brand-soft';

  return (
    <div className="min-h-screen bg-page text-ink md:flex">
      <Sidebar view={view} onChange={setView} />

      <main className="min-w-0 flex-1 px-4 pb-24 pt-5 md:px-6 md:pb-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:hidden">
              <span className="text-lg font-semibold tracking-tight">Fursat</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              {view === 'today' ? prettyDate(selectedDate) : 'Anchors'}
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
          </header>

          {view === 'today' ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-5">
                <Greeting />
                <Card>
                  <DaySummary />
                  <Timeline />
                </Card>
              </div>
              <div className="space-y-5">
                <Card>
                  <MonthCalendar />
                </Card>
                <Card>
                  <TaskInbox />
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid max-w-4xl gap-5 md:grid-cols-2">
              <Card>
                <AnchorForm />
              </Card>
              <Card>
                <AnchorList />
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

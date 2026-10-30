import { useState } from 'react';
import { AnchorForm } from './components/AnchorForm';
import { AnchorList } from './components/AnchorList';
import { Card } from './components/Card';
import { DataControls } from './components/DataControls';
import { DayHoursCard } from './components/DayHoursCard';
import { DaySummary } from './components/DaySummary';
import { EmptyStart } from './components/EmptyStart';
import { Greeting } from './components/Greeting';
import { MonthCalendar } from './components/MonthCalendar';
import { InstallButton } from './components/InstallButton';
import { PlannerDnd } from './components/PlannerDnd';
import { PrayerCard } from './components/PrayerCard';
import { PwaStatus } from './components/PwaStatus';
import { Sidebar, type View } from './components/Sidebar';
import { TaskInbox } from './components/TaskInbox';
import { Timeline } from './components/Timeline';
import { WindowNotice } from './components/WindowNotice';
import { CarryOverNotice } from './components/CarryOverNotice';
import { WeekView } from './components/WeekView';
import { addDays, todayString } from './lib/time';
import { usePrayerSync } from './lib/usePrayerSync';
import { weekDates } from './lib/week';
import { usePlannerStore } from './store/usePlannerStore';

function prettyDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function weekLabel(date: string): string {
  const days = weekDates(date);
  const [first, last] = [days[0], days[6]].map((d) => {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day);
  });
  const monthYear = last.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  if (first.getMonth() === last.getMonth()) return `${first.getDate()}–${last.getDate()} ${monthYear}`;
  const start = first.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const end = last.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${start} – ${end}`;
}

export default function App() {
  const [view, setView] = useState<View>('today');
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate);
  const isEmpty = usePlannerStore((s) => s.anchors.length === 0 && s.tasks.length === 0);
  // A week can cross into the next month, so its last day's month is fetched too.
  usePrayerSync(view === 'week' ? weekDates(selectedDate)[6] : undefined);

  const step = view === 'week' ? 7 : 1;
  const unit = view === 'week' ? 'week' : 'day';

  const navButton =
    'rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-ink hover:bg-brand-soft';

  return (
    <div className="min-h-screen bg-page text-ink md:flex">
      <Sidebar view={view} onChange={setView} />

      <main className="min-w-0 flex-1 px-5 pb-28 pt-8 md:px-10 md:pb-16">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 md:hidden">
              <span className="text-lg font-semibold tracking-tight">Fursat</span>
              <InstallButton />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {view === 'today' ? prettyDate(selectedDate) : view === 'week' ? weekLabel(selectedDate) : 'Anchors'}
            </h1>
            <div className="flex items-center gap-2">
              <button className={navButton} onClick={() => setSelectedDate(addDays(selectedDate, -step))} aria-label={`Previous ${unit}`}>
                ←
              </button>
              <button className={navButton} onClick={() => setSelectedDate(todayString())}>
                {view === 'week' ? 'This week' : 'Today'}
              </button>
              <button className={navButton} onClick={() => setSelectedDate(addDays(selectedDate, step))} aria-label={`Next ${unit}`}>
                →
              </button>
            </div>
          </header>

          {view === 'today' ? (
            <PlannerDnd>
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-8">
                  {isEmpty && <EmptyStart onAddAnchor={() => setView('anchors')} />}
                  <Greeting />
                  <Card>
                    <CarryOverNotice />
                    <WindowNotice />
                    <DaySummary />
                    <Timeline />
                  </Card>
                </div>
                <div className="space-y-8">
                  <Card>
                    <MonthCalendar />
                  </Card>
                  <Card>
                    <TaskInbox />
                  </Card>
                </div>
              </div>
            </PlannerDnd>
          ) : view === 'week' ? (
            <PlannerDnd>
              <WeekView
                onOpenDay={(date) => {
                  setSelectedDate(date);
                  setView('today');
                }}
              />
            </PlannerDnd>
          ) : (
            <div className="grid max-w-4xl items-start gap-8 md:grid-cols-2">
              <div className="space-y-8">
                <Card>
                  <AnchorForm />
                </Card>
                <Card>
                  <PrayerCard />
                </Card>
              </div>
              <div className="space-y-8">
                <Card>
                  <AnchorList />
                  <DataControls />
                </Card>
                <Card>
                  <DayHoursCard />
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <PwaStatus />
    </div>
  );
}

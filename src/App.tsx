import { AnimatePresence, m } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { AnchorForm } from './components/AnchorForm';
import { AnchorList } from './components/AnchorList';
import { Aurora } from './components/Aurora';
import { Card } from './components/Card';
import { CarryOverNotice } from './components/CarryOverNotice';
import { DataControls } from './components/DataControls';
import { DayHoursCard } from './components/DayHoursCard';
import { DaySummary } from './components/DaySummary';
import { EmptyStart } from './components/EmptyStart';
import { FocusLayer } from './components/FocusLayer';
import { Greeting } from './components/Greeting';
import { InstallButton } from './components/InstallButton';
import { MonthCalendar } from './components/MonthCalendar';
import { Motion } from './components/Motion';
import { PlannerDnd } from './components/PlannerDnd';
import { PrayerCard } from './components/PrayerCard';
import { PwaStatus } from './components/PwaStatus';
import { ShortcutHelp } from './components/ShortcutHelp';
import { Sidebar, type View } from './components/Sidebar';
import { TaskInbox } from './components/TaskInbox';
import { ThemeSwitch } from './components/ThemeSwitch';
import { Timeline } from './components/Timeline';
import { Toaster } from './components/Toaster';
import { WeekView } from './components/WeekView';
import { WindowNotice } from './components/WindowNotice';
import { pickFocusTask } from './lib/focus';
import { isTypingTarget, shortcutAction } from './lib/shortcuts';
import { useApplyTheme } from './lib/theme';
import { addDays, nowMinutes, todayString } from './lib/time';
import { usePrayerSync } from './lib/usePrayerSync';
import { weekDates } from './lib/week';
import { useFocus } from './store/useFocus';
import { usePlannerStore } from './store/usePlannerStore';
import { useToasts } from './store/useToasts';

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

function Shell() {
  useApplyTheme();
  const [view, setView] = useState<View>('today');
  const [helpOpen, setHelpOpen] = useState(false);
  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate);
  const isEmpty = usePlannerStore((s) => s.anchors.length === 0 && s.tasks.length === 0);
  // A week can cross into the next month, so its last day's month is fetched too.
  usePrayerSync(view === 'week' ? weekDates(selectedDate)[6] : undefined);

  const step = view === 'week' ? 7 : 1;
  const unit = view === 'week' ? 'week' : 'day';

  // Keyboard shortcuts read the latest view without re-binding the listener on every change.
  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = shortcutAction({
        key: e.key,
        modified: e.ctrlKey || e.metaKey || e.altKey,
        typing: isTypingTarget(e.target),
      });
      if (!action) return;
      // While the full-screen timer is up it owns the keyboard.
      const focus = useFocus.getState();
      if (focus.session && !focus.minimized) return;
      const { selectedDate: date, setSelectedDate: setDate } = usePlannerStore.getState();
      const by = viewRef.current === 'week' ? 7 : 1;
      switch (action) {
        case 'today': setView('today'); break;
        case 'week': setView('week'); break;
        case 'anchors': setView('anchors'); break;
        case 'new-task':
          e.preventDefault();
          setView('today');
          window.setTimeout(() => document.getElementById('task-title')?.focus(), 80);
          break;
        case 'focus': {
          if (focus.session) {
            focus.setMinimized(false);
            break;
          }
          const task = pickFocusTask(usePlannerStore.getState().tasks, todayString(), nowMinutes());
          if (task) focus.start(task);
          else useToasts.getState().show('Nothing planned for today yet. Place a task in a gap first.');
          break;
        }
        case 'prev': setDate(addDays(date, -by)); break;
        case 'next': setDate(addDays(date, by)); break;
        case 'help': setHelpOpen((open) => !open); break;
        case 'close': setHelpOpen(false); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navButton =
    'rounded-full border border-line bg-card px-4 py-1.5 text-sm text-ink backdrop-blur-md hover:bg-brand-soft';
  const title = view === 'today' ? prettyDate(selectedDate) : view === 'week' ? weekLabel(selectedDate) : 'Anchors';

  return (
    <>
      <Aurora />
      <div className="relative z-10 min-h-screen text-ink md:flex">
        <Sidebar view={view} onChange={setView} />

        <main className="min-w-0 flex-1 px-5 pb-28 pt-8 md:px-10 md:pb-16">
          <div className="mx-auto max-w-6xl">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 md:hidden">
                <span className="text-lg font-semibold tracking-tight">Fursat</span>
                <InstallButton />
                <span className="ml-auto">
                  <ThemeSwitch id="theme-pill-mobile" />
                </span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <m.h1
                  key={title}
                  className="text-2xl font-semibold tracking-tight"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {title}
                </m.h1>
              </AnimatePresence>
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
                <button
                  className={`${navButton} hidden px-3 md:block`}
                  onClick={() => setHelpOpen(true)}
                  aria-label="Keyboard shortcuts"
                  title="Keyboard shortcuts"
                >
                  ?
                </button>
              </div>
            </header>

            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={view}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {view === 'today' ? (
                  <PlannerDnd>
                    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
                      <div className="min-w-0 space-y-8">
                        {isEmpty && <EmptyStart onAddAnchor={() => setView('anchors')} />}
                        <Greeting />
                        <Card delay={0.08}>
                          <CarryOverNotice />
                          <WindowNotice />
                          <DaySummary />
                          <Timeline />
                        </Card>
                      </div>
                      <div className="space-y-8">
                        <Card delay={0.12}>
                          <MonthCalendar />
                        </Card>
                        <Card delay={0.18}>
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
                      <Card delay={0.08}>
                        <PrayerCard />
                      </Card>
                    </div>
                    <div className="space-y-8">
                      <Card delay={0.04}>
                        <AnchorList />
                        <DataControls />
                      </Card>
                      <Card delay={0.12}>
                        <DayHoursCard />
                      </Card>
                    </div>
                  </div>
                )}
              </m.div>
            </AnimatePresence>
          </div>
        </main>
        <PwaStatus />
      </div>
      <FocusLayer />
      <Toaster />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <Motion>
      <Shell />
    </Motion>
  );
}

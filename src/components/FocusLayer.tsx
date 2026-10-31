import { AnimatePresence, m } from 'motion/react';
import { useEffect, useState } from 'react';
import { playChime } from '../lib/chime';
import { formatClock, isRunning, progress, remainingMs } from '../lib/focus';
import { formatDuration, fromMinutes } from '../lib/time';
import { usePlannerStore } from '../store/usePlannerStore';
import { useFocus } from '../store/useFocus';
import { useToasts } from '../store/useToasts';

const BASE_TITLE = 'Fursat: Day Planner';

/** Current time in ms, refreshed a few times a second while `active`. */
function useTick(active: boolean, every = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), every);
    return () => window.clearInterval(id);
  }, [active, every]);
  return now;
}

const icon = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

function Ring({ value, size, stroke, done }: { value: number; size: number; stroke: number; done: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={done ? 0 : c * value}
        style={{ transition: 'stroke-dashoffset 0.3s linear' }}
      />
    </svg>
  );
}

/**
 * The focus timer. A full-screen view with a big countdown while a session runs, a small
 * pill when it is tucked away, and the browser tab title keeps the time either way.
 */
export function FocusLayer() {
  const session = useFocus((s) => s.session);
  const minimized = useFocus((s) => s.minimized);
  const sound = useFocus((s) => s.sound);
  const { togglePause, extend, finish, stop, setMinimized, toggleSound } = useFocus.getState();
  const task = usePlannerStore((s) => s.tasks.find((t) => t.id === session?.taskId));
  const toggleDone = usePlannerStore((s) => s.toggleDone);
  const showToast = useToasts((s) => s.show);
  const now = useTick(session !== null);

  const remaining = session ? remainingMs(session, now) : 0;
  const running = session ? isRunning(session) : false;
  const finished = session?.finished ?? false;
  const overlayOpen = session !== null && task !== undefined && !minimized;

  // The task was deleted while its timer was going: nothing left to focus on.
  useEffect(() => {
    if (session && !task) stop();
  }, [session, task, stop]);

  // Time is up: freeze, chime, and bring the full view back so it is seen.
  useEffect(() => {
    if (!session || !task || session.finished || remaining > 0) return;
    finish();
    setMinimized(false);
    if (sound) playChime();
    showToast(`Time's up: ${task.title}`);
  }, [session, task, remaining, sound, finish, setMinimized, showToast]);

  // The tab title keeps the time, so it can be glanced at from another tab.
  useEffect(() => {
    if (session && task) document.title = finished ? `Time's up · ${task.title}` : `${formatClock(remaining)} · ${task.title}`;
  });
  const active = session !== null;
  useEffect(() => {
    if (!active) return;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [active]);

  // Escape tucks the view away; Space pauses or resumes (unless a button has focus and would click itself).
  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMinimized(true);
      else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement) && !finished) {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlayOpen, finished, setMinimized, togglePause]);

  const value = session ? progress(session, now) : 0;
  const slot = task?.startMin !== undefined ? `${fromMinutes(task.startMin)}–${fromMinutes(task.startMin + task.durationMin)}` : null;

  const pill = 'rounded-full border border-line bg-card px-5 py-2 text-sm font-medium text-ink backdrop-blur-md hover:bg-brand-soft';

  function markDone() {
    if (!task) return;
    if (task.status === 'planned') toggleDone(task.id);
    stop();
    showToast(`Nice work. ${task.title} is done.`);
  }

  return (
    <>
      <AnimatePresence>
        {overlayOpen && session && task && (
          <m.div
            key="focus-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Focus timer for ${task.title}`}
            className="fixed inset-0 z-40 overflow-y-auto bg-page/80 px-4 backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-6 py-10 text-center">
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand">
                {finished ? 'Time’s up' : running ? 'Focusing' : 'Paused'}
              </span>

              <h2 className="display max-w-full break-words text-4xl sm:text-5xl">{task.title}</h2>

              <m.div
                className="relative grid place-items-center"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              >
                <div className="hidden sm:block">
                  <Ring value={value} size={340} stroke={10} done={finished} />
                </div>
                <div className="sm:hidden">
                  <Ring value={value} size={260} stroke={9} done={finished} />
                </div>
                <div className="absolute text-center">
                  <div
                    role="timer"
                    aria-live="off"
                    className={`display font-mono text-6xl tabular-nums sm:text-7xl ${finished ? 'text-gradient' : ''}`}
                  >
                    {formatClock(remaining)}
                  </div>
                  <div className="mt-2 text-sm text-muted">
                    {formatDuration(task.durationMin)}
                    {slot ? ` · planned ${slot}` : ''}
                  </div>
                </div>
              </m.div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {finished ? (
                  <>
                    <button type="button" autoFocus onClick={markDone} className="rounded-full bg-brand px-6 py-2 text-sm font-medium text-on-brand">
                      Mark done
                    </button>
                    <button type="button" onClick={() => extend(10)} className={pill}>
                      +10 min
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" autoFocus onClick={togglePause} className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2 text-sm font-medium text-on-brand">
                      <svg className="h-4 w-4" {...icon}>
                        {running ? <path d="M8 5v14M16 5v14" /> : <path d="m7 4 13 8-13 8Z" fill="currentColor" />}
                      </svg>
                      {running ? 'Pause' : 'Resume'}
                    </button>
                    <button type="button" onClick={() => extend(5)} className={pill}>
                      +5 min
                    </button>
                    <button type="button" onClick={markDone} className={pill}>
                      Done early
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted">
                <button type="button" onClick={() => setMinimized(true)} className="hover:text-ink">
                  Minimise <kbd>Esc</kbd>
                </button>
                <button type="button" onClick={stop} className="hover:text-danger-line">
                  Stop
                </button>
                <button type="button" onClick={toggleSound} aria-pressed={sound} className="hover:text-ink">
                  Sound {sound ? 'on' : 'off'}
                </button>
              </div>
              {!finished && (
                <p className="text-xs text-muted">
                  <kbd>Space</kbd> pauses · <kbd>Esc</kbd> tucks this away and the timer keeps going
                </p>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {session && task && minimized && (
          <m.button
            key="focus-pill"
            type="button"
            onClick={() => setMinimized(false)}
            aria-label={`Open focus timer for ${task.title}, ${formatClock(remaining)} left`}
            className="fixed bottom-24 left-4 z-30 flex items-center gap-3 rounded-full bg-card py-2 pl-2 pr-4 text-sm shadow-lg ring-1 ring-line backdrop-blur-md md:bottom-6 md:left-64"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            <span className="grid place-items-center">
              <Ring value={value} size={30} stroke={4} done={finished} />
            </span>
            <span className="text-left leading-tight">
              <span className="block font-mono font-semibold tabular-nums">{finished ? 'Time’s up' : formatClock(remaining)}</span>
              <span className="block max-w-[10rem] truncate text-xs text-muted">{task.title}</span>
            </span>
          </m.button>
        )}
      </AnimatePresence>
    </>
  );
}

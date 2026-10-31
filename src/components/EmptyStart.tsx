import { m } from 'motion/react';
import { usePlannerStore } from '../store/usePlannerStore';

const STEPS = [
  { n: '01', title: 'Add what can’t move', body: 'Work, classes, meals, prayers. These are your anchors.' },
  { n: '02', title: 'See the gaps', body: 'Fursat shows the free time left between them.' },
  { n: '03', title: 'Drop tasks in', body: 'Drag a task into a gap that fits. Done.' },
];

/** Shown to a first-time visitor, before there is anything to plan around. */
export function EmptyStart({ onAddAnchor }: { onAddAnchor: () => void }) {
  const loadSample = usePlannerStore((s) => s.loadSample);

  return (
    <m.section
      aria-label="Getting started"
      className="surface rounded-3xl p-6 sm:p-8"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="display text-3xl sm:text-4xl">
        Start with what <span className="text-gradient">can’t move.</span>
      </h2>

      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <m.li
            key={s.n}
            className="rounded-2xl bg-page/70 p-4 ring-1 ring-line"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="font-mono text-xs text-brand">{s.n} / 03</span>
            <h3 className="mt-1 text-base font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
          </m.li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={onAddAnchor} className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-on-brand">
          Add an anchor
        </button>
        <button
          type="button"
          onClick={loadSample}
          className="rounded-full border border-line bg-card px-5 py-2 text-sm font-medium text-ink hover:bg-brand-soft"
        >
          Try a sample day
        </button>
      </div>
    </m.section>
  );
}

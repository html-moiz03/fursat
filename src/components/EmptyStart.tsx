import { usePlannerStore } from '../store/usePlannerStore';

/** Shown to a first-time visitor, before there is anything to plan around. */
export function EmptyStart({ onAddAnchor }: { onAddAnchor: () => void }) {
  const loadSample = usePlannerStore((s) => s.loadSample);

  return (
    <section aria-label="Getting started" className="rounded-2xl bg-brand-soft p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight">Start with what can't move</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Add work, classes or meals as anchors. Fursat shows the free time between them, and you place your tasks in
        those gaps.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAddAnchor}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand"
        >
          Add an anchor
        </button>
        <button
          type="button"
          onClick={loadSample}
          className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-page"
        >
          Try a sample day
        </button>
      </div>
    </section>
  );
}

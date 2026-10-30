import { usePlannerStore } from '../store/usePlannerStore';

export type View = 'today' | 'anchors';

const icon = 'h-5 w-5 shrink-0';

function TodayIcon() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

function AnchorsIcon() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="5" rx="2.5" />
      <rect x="3.5" y="15" width="17" height="5" rx="2.5" />
      <path d="M9 12h6" strokeDasharray="1 3" />
    </svg>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-on-brand">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="3" y="4" width="18" height="5" rx="2.5" />
          <rect x="3" y="15" width="18" height="5" rx="2.5" />
          <rect x="9" y="11" width="6" height="2" rx="1" opacity="0.6" />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight">Fursat</span>
    </div>
  );
}

const ITEMS: { view: View; label: string; Icon: () => React.JSX.Element }[] = [
  { view: 'today', label: 'Today', Icon: TodayIcon },
  { view: 'anchors', label: 'Anchors', Icon: AnchorsIcon },
];

export function Sidebar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const inboxCount = usePlannerStore((s) => s.tasks.filter((t) => t.status === 'inbox').length);
  const anchorCount = usePlannerStore((s) => s.anchors.length);
  const counts: Record<View, number> = { today: inboxCount, anchors: anchorCount };

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-8 p-5 md:flex">
        <Brand />
        <nav aria-label="Main" className="rounded-2xl bg-card p-2 ring-1 ring-line">
          {ITEMS.map(({ view: v, label, Icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              aria-current={view === v ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${
                view === v ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon />
              <span className="flex-1">{label}</span>
              {counts[v] > 0 && (
                <span className="rounded-full bg-page px-2 py-0.5 text-xs text-muted">{counts[v]}</span>
              )}
            </button>
          ))}
        </nav>
        <p className="mt-auto text-xs leading-relaxed text-muted">
          Fix what can't move. Fursat shows the time that's left.
        </p>
      </aside>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-card md:hidden"
      >
        {ITEMS.map(({ view: v, label, Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-current={view === v ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              view === v ? 'text-brand' : 'text-muted'
            }`}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}

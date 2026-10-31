import { m } from 'motion/react';
import type { Theme } from '../lib/theme';
import { usePlannerStore } from '../store/usePlannerStore';

const icon = { className: 'h-4 w-4', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

const OPTIONS: { value: Theme; label: string; svg: React.JSX.Element }[] = [
  {
    value: 'light',
    label: 'Light',
    svg: (
      <svg {...icon}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Midnight',
    svg: (
      <svg {...icon}>
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'Auto',
    svg: (
      <svg {...icon}>
        <rect x="3.5" y="4.5" width="17" height="12" rx="2.5" />
        <path d="M9 20h6M12 16.5V20" />
      </svg>
    ),
  },
];

/** Three-way switch: Light, Midnight, or follow the device. */
export function ThemeSwitch({ id = 'theme-pill' }: { id?: string }) {
  const theme = usePlannerStore((s) => s.settings.theme);
  const updateSettings = usePlannerStore((s) => s.updateSettings);

  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-full bg-page p-1 ring-1 ring-line">
      {OPTIONS.map((o) => {
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => updateSettings({ theme: o.value })}
            className={`relative grid h-7 w-8 place-items-center rounded-full ${active ? 'text-on-brand' : 'text-muted hover:text-ink'}`}
          >
            {active && (
              <m.span
                layoutId={id}
                className="absolute inset-0 rounded-full bg-brand"
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              />
            )}
            <span className="relative">{o.svg}</span>
          </button>
        );
      })}
    </div>
  );
}

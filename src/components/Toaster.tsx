import { AnimatePresence, m } from 'motion/react';
import { useToasts } from '../store/useToasts';

/** Short messages at the bottom of the screen. */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-8"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <m.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-full px-4 py-2.5 text-sm shadow-lg ring-1 backdrop-blur-md ${
              t.tone === 'warn' ? 'bg-warn text-warn-ink ring-warn-line' : 'bg-card text-ink ring-line'
            }`}
          >
            <span>{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-ink">
              ×
            </button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

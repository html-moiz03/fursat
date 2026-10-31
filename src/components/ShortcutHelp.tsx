import { AnimatePresence, m } from 'motion/react';
import { SHORTCUT_LIST } from '../lib/shortcuts';

/** The list of keyboard shortcuts, opened with "?". */
export function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            className="surface w-full max-w-sm rounded-3xl p-6"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Keyboard shortcuts</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
                ×
              </button>
            </div>
            <ul className="space-y-2.5 text-sm">
              {SHORTCUT_LIST.map((s) => (
                <li key={s.keys} className="flex items-center justify-between gap-4">
                  <span className="text-muted">{s.label}</span>
                  <kbd>{s.keys}</kbd>
                </li>
              ))}
            </ul>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

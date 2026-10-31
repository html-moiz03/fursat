import { m } from 'motion/react';
import type { ReactNode } from 'react';

/** A glassy rounded surface that rises into place. `delay` (seconds) staggers a group of cards. */
export function Card({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <m.div
      className={`surface rounded-3xl p-6 ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

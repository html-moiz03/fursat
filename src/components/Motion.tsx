import { LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

const loadFeatures = () => import('./motionFeatures').then((m) => m.default);

/**
 * Animation setup for the whole app: the engine loads after first paint, and
 * the "reduce motion" setting of the device switches transform animations off.
 */
export function Motion({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}

import { useEffect, useRef, useState } from 'react';

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Where a tween that started at `from` is after `elapsed` of `duration` ms. */
export function tweenValue(from: number, to: number, elapsed: number, duration: number): number {
  if (duration <= 0 || elapsed >= duration) return to;
  return from + (to - from) * easeOutCubic(Math.max(0, elapsed) / duration);
}

/**
 * A number that glides to its new value instead of jumping. Respects "reduce motion":
 * with that on, it simply follows the value.
 */
export function useTween(value: number, duration = 700): number {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  shownRef.current = shown;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || shownRef.current === value) {
      setShown(value);
      return;
    }
    const from = shownRef.current;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      setShown(tweenValue(from, value, now - start, duration));
      if (now - start < duration) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return shown;
}

import { describe, expect, it } from 'vitest';
import { easeOutCubic, tweenValue } from './useTween';

describe('tweenValue', () => {
  it('starts at the old value and ends on the new one', () => {
    expect(tweenValue(0, 100, 0, 700)).toBe(0);
    expect(tweenValue(0, 100, 700, 700)).toBe(100);
    expect(tweenValue(0, 100, 5000, 700)).toBe(100);
  });

  it('eases out: past the halfway point at half the time', () => {
    expect(tweenValue(0, 100, 350, 700)).toBeGreaterThan(50);
  });

  it('works downwards too, and never overshoots', () => {
    const v = tweenValue(100, 20, 200, 700);
    expect(v).toBeLessThan(100);
    expect(v).toBeGreaterThan(20);
  });

  it('handles a zero duration', () => {
    expect(tweenValue(0, 10, 0, 0)).toBe(10);
  });

  it('easeOutCubic maps 0 to 0 and 1 to 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });
});

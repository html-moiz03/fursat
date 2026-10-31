import { describe, expect, it } from 'vitest';
import { THEME_COLOR, resolveTheme } from './theme';

describe('resolveTheme', () => {
  it('uses an explicit choice whatever the device prefers', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('follows the device when set to system', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('has a browser colour for both themes', () => {
    expect(THEME_COLOR.light).toMatch(/^#/);
    expect(THEME_COLOR.dark).toMatch(/^#/);
  });
});

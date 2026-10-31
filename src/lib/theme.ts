import { useEffect } from 'react';
import type { Settings } from '../types';
import { usePlannerStore } from '../store/usePlannerStore';

export type Theme = Settings['theme'];
export type Resolved = 'light' | 'dark';

/** The theme actually shown: 'system' follows the device. */
export function resolveTheme(theme: Theme, systemPrefersDark: boolean): Resolved {
  if (theme === 'system') return systemPrefersDark ? 'dark' : 'light';
  return theme;
}

/** Colour of the browser / installed-app title bar for each theme. */
export const THEME_COLOR: Record<Resolved, string> = { light: '#f8f7f3', dark: '#090b0e' };

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Keeps <html data-theme> and the browser theme colour in step with the saved setting. */
export function useApplyTheme() {
  const theme = usePlannerStore((s) => s.settings.theme);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const apply = () => {
      const resolved = resolveTheme(theme, media.matches);
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved]);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}

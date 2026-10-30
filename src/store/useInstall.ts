import { create } from 'zustand';

/** Chromium's install prompt event, which is not in the DOM typings yet. */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallState = {
  /** The browser's saved install prompt, when it offered one. */
  deferred: InstallPromptEvent | null;
  /** Already running as an installed app. */
  installed: boolean;
  install: () => Promise<void>;
};

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone and iPad Safari can install a site but never fire the prompt event. */
export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return ios && !/crios|fxios|edgios/i.test(ua);
}

export const useInstall = create<InstallState>((set, get) => ({
  deferred: null,
  installed: isStandalone(),
  install: async () => {
    const event = get().deferred;
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    // The browser only allows one prompt per event.
    set({ deferred: null, installed: outcome === 'accepted' });
  },
}));

// Registered once when the app loads, because the browser can fire this very early.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    useInstall.setState({ deferred: e as InstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => useInstall.setState({ deferred: null, installed: true }));
}

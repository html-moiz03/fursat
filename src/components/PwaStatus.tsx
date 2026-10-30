import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const HOUR = 60 * 60 * 1000;

/** A quiet notice for two moments: the app is ready offline, and a new version is waiting. */
export function PwaStatus() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // An installed app can stay open for days, so look for a new version now and then.
      if (registration) setInterval(() => void registration.update(), HOUR);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    const id = setTimeout(() => setOfflineReady(false), 6000);
    return () => clearTimeout(id);
  }, [offlineReady, setOfflineReady]);

  if (!offlineReady && !needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 right-4 z-30 max-w-xs rounded-2xl bg-card p-4 text-sm shadow-lg ring-1 ring-line md:bottom-6"
    >
      {needRefresh ? (
        <>
          <p>A new version of Fursat is ready.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void updateServiceWorker(true)}
              className="rounded-lg bg-brand px-3 py-1.5 font-medium text-on-brand"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="rounded-lg border border-line px-3 py-1.5 text-muted hover:text-ink"
            >
              Later
            </button>
          </div>
        </>
      ) : (
        <p>Fursat is ready to work offline.</p>
      )}
    </div>
  );
}

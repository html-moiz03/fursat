import { useState } from 'react';
import { isIosSafari, useInstall } from '../store/useInstall';

/** Offers to install Fursat as an app. Renders nothing when that is not possible or already done. */
export function InstallButton() {
  const installed = useInstall((s) => s.installed);
  const canPrompt = useInstall((s) => s.deferred !== null);
  const install = useInstall((s) => s.install);
  const [showHint, setShowHint] = useState(false);

  if (installed) return null;

  const button =
    'rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium text-ink hover:bg-brand-soft';

  if (canPrompt) {
    return (
      <button type="button" className={button} onClick={install}>
        Install app
      </button>
    );
  }

  if (isIosSafari()) {
    return (
      <>
        <button type="button" className={button} aria-expanded={showHint} onClick={() => setShowHint((v) => !v)}>
          Install app
        </button>
        {showHint && (
          <p className="basis-full text-xs leading-relaxed text-muted">
            On iPhone or iPad: tap Share, then Add to Home Screen.
          </p>
        )}
      </>
    );
  }

  return null;
}

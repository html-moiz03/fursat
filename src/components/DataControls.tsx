import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';

export function DataControls() {
  const hasAnchors = usePlannerStore((s) => s.anchors.length > 0);
  const hasTasks = usePlannerStore((s) => s.tasks.length > 0);
  const loadSample = usePlannerStore((s) => s.loadSample);
  const clearAll = usePlannerStore((s) => s.clearAll);
  const [confirming, setConfirming] = useState(false);

  const button = 'rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-page';

  return (
    <div className="mt-6 border-t border-line pt-4">
      {confirming ? (
        <div className="space-y-2">
          <p className="text-sm">Delete every anchor and task? This can't be undone.</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
              onClick={() => {
                clearAll();
                setConfirming(false);
              }}
            >
              Yes, clear everything
            </button>
            <button type="button" className={button} onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {!hasAnchors && (
            <button type="button" className={button} onClick={loadSample}>
              Load a sample day
            </button>
          )}
          {(hasAnchors || hasTasks) && (
            <button type="button" className={`${button} text-muted hover:text-red-600`} onClick={() => setConfirming(true)}>
              Clear all data
            </button>
          )}
        </div>
      )}
    </div>
  );
}

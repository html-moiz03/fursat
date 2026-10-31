import { useCarry } from '../store/useCarry';

/** Reads out keyboard moves to screen readers. Always mounted, so it survives a task changing day. */
export function CarryAnnouncer() {
  const message = useCarry((s) => s.message);
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}

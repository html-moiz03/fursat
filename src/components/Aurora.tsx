/** A slow drifting glow and a touch of film grain behind everything. Pure CSS, off for reduced motion. */
export function Aurora() {
  return (
    <>
      <div className="aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  );
}

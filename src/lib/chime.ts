/** A short three-note chime for the end of a focus session. Silent if the browser blocks audio. */
export function playChime(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const t0 = ctx.currentTime;
    [660, 880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const at = t0 + i * 0.18;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.16, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 1);
    });
    window.setTimeout(() => void ctx.close(), 2200);
  } catch {
    // Audio is a nicety; the toast and the screen still say the time is up.
  }
}

/**
 * Short UI beeps when adjusting filament counts (Web Audio — no asset files).
 * Browsers may require a user gesture before audio; clicks on +/- qualify.
 */

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("Audio only in browser");
  }
  if (!sharedCtx) {
    sharedCtx = new AudioContext();
  }
  return sharedCtx;
}

/** delta &gt; 0 = add stock (higher tone), delta &lt; 0 = remove (lower tone) */
export function playFilamentAdjustSound(delta: number): void {
  if (delta === 0) return;
  try {
    const ctx = getAudioContext();
    void ctx.resume();

    const up = delta > 0;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = up ? 880 : 380;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  } catch {
    /* ignore: autoplay policy or missing API */
  }
}

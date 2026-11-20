export type CelebrationStyle = 'sparkle' | 'confetti' | 'fireworks';

export interface CelebrationPayload {
  id: number;
  message: string;
  subtext?: string;
  style: CelebrationStyle;
}

/**
 * Quiet, refined feedback chime (subtle & optional)
 */
export function playSuccessChime(_style: CelebrationStyle = 'sparkle') {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(784, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 500);
  } catch {
    // Ignore autoplay limits
  }
}

/**
 * Clean minimalist milestone toast (zero confetti fireworks clutter)
 */
export function celebrateSuccess(
  message: string,
  style: CelebrationStyle = 'sparkle',
  subtext?: string
) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<CelebrationPayload>('hanzi-celebrate', {
      detail: {
        id: Date.now() + Math.random(),
        message,
        subtext,
        style,
      },
    })
  );
}

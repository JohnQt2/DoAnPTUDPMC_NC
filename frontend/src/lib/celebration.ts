import confetti from 'canvas-confetti';

export type CelebrationStyle = 'sparkle' | 'confetti' | 'fireworks';

export interface CelebrationPayload {
  id: number;
  message: string;
  subtext?: string;
  style: CelebrationStyle;
}

// Refined Champagne-Gold, Rose-Quartz, Pearl & Lilac palette (Apple/Stripe taste, never garish)
const REFINED_PALETTE = ['#fb7185', '#fbbf24', '#fde68a', '#e879f9', '#34d399', '#ffffff'];

/**
 * Delicate pentatonic crystal bell chime via Web Audio API
 */
export function playSuccessChime(style: CelebrationStyle = 'sparkle') {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const notes =
      style === 'fireworks'
        ? [523.25, 659.25, 783.99, 1046.5]
        : style === 'confetti'
          ? [587.33, 783.99, 1046.5]
          : [659.25, 987.77];

    const now = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.065, now + idx * 0.06 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.34);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch {
    // Ignore autoplay limits
  }
}

/**
 * Refined Magic UI-style Side Silk Ribbon Confetti (only for milestones — smooth, slow drift, subtle!)
 */
function fireRefinedMilestoneDrift(intensity: 'gentle' | 'grand') {
  const count = intensity === 'grand' ? 32 : 18;
  const spread = intensity === 'grand' ? 55 : 42;

  confetti({
    particleCount: count,
    angle: 62,
    spread,
    startVelocity: intensity === 'grand' ? 36 : 26,
    gravity: 0.72,
    drift: 0.3,
    ticks: 140,
    scalar: 0.75,
    origin: { x: 0.04, y: 0.75 },
    colors: REFINED_PALETTE,
    disableForReducedMotion: true,
  });

  confetti({
    particleCount: count,
    angle: 118,
    spread,
    startVelocity: intensity === 'grand' ? 36 : 26,
    gravity: 0.72,
    drift: -0.3,
    ticks: 140,
    scalar: 0.75,
    origin: { x: 0.96, y: 0.75 },
    colors: REFINED_PALETTE,
    disableForReducedMotion: true,
  });
}

/**
 * Unified Editorial Celebration:
 * - 'sparkle': Clean Magic UI SVG Checkmark Seal + Expanding Glass Ripple (NO cluttered confetti!)
 * - 'confetti': SVG Seal + Gentle Champagne/Rose Silk Ribbon Drift
 * - 'fireworks': SVG Trophy Seal + Grand Dual-Wave Champagne-Gold Ribbon Celebration
 */
export function celebrateSuccess(
  message: string,
  style: CelebrationStyle = 'sparkle',
  subtext?: string
) {
  if (typeof window === 'undefined') return;

  playSuccessChime(style);

  if (style === 'confetti') {
    fireRefinedMilestoneDrift('gentle');
  } else if (style === 'fireworks') {
    fireRefinedMilestoneDrift('grand');
    setTimeout(() => fireRefinedMilestoneDrift('gentle'), 380);
  }

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

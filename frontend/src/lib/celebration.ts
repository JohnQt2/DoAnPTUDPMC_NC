export type CelebrationStyle = 'sparkle' | 'confetti' | 'fireworks';

export interface CelebrationPayload {
  id: number;
  message: string;
  subtext?: string;
  style: CelebrationStyle;
}

export function playSuccessChime(style: CelebrationStyle = 'sparkle') {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const notes = style === 'fireworks' ? [523.25, 659.25, 783.99] : [659.25, 880];
    const now = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.045, now + idx * 0.055 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.055 + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.26);
    });

    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // Ignore autoplay restrictions
  }
}

export function celebrateSuccess(
  message: string,
  style: CelebrationStyle = 'sparkle',
  subtext?: string
) {
  if (typeof window === 'undefined') return;
  playSuccessChime(style);
  window.dispatchEvent(
    new CustomEvent<CelebrationPayload>('hanzi-celebrate', {
      detail: { id: Date.now() + Math.random(), message, subtext, style },
    })
  );
}

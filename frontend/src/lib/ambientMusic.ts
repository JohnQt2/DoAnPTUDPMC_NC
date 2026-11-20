/**
 * Chill East-Asian Pentatonic Guqin / Guzheng & Warm Tea-Room Pad BGM Engine.
 * Built with pure Web Audio API (0 KB external audio download, instant startup,
 * silky fade-in/fade-out, and automatic browser-autoplay unlock on first gesture).
 */

class AmbientMusicController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private delayL: DelayNode | null = null;
  private delayR: DelayNode | null = null;
  private timerId: number | null = null;
  private stepIdx = 0;
  private isEnabled = true;
  private isRunning = false;
  private listeners = new Set<(playing: boolean) => void>();
  private unlockBound = false;

  // Traditional Chinese 5-tone (WuSheng: Gong, Shang, Jue, Zhi, Yu) calm phrasing in F Major / D Minor pentatonic
  private readonly melodyNotes = [
    261.63, // C4
    293.66, // D4
    349.23, // F4
    392.0,  // G4
    440.0,  // A4
    523.25, // C5
    440.0,  // A4
    392.0,  // G4
    349.23, // F4
    293.66, // D4
    392.0,  // G4
    523.25, // C5
    587.33, // D5
    523.25, // C5
    440.0,  // A4
    349.23, // F4
  ];

  private readonly bassRoots = [
    174.61, // F3
    146.83, // D3
    130.81, // C3
    196.0,  // G3
  ];

  public subscribe(cb: (playing: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.isEnabled);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.isEnabled));
  }

  public initAutoStart(): void {
    if (typeof window === 'undefined') return;
    if (this.isEnabled && !this.isRunning) {
      this.tryStartAudio();
    }
    if (!this.unlockBound) {
      this.unlockBound = true;
      const unlock = () => {
        if (this.isEnabled) {
          this.tryStartAudio();
        }
        if (this.ctx && this.ctx.state === 'running') {
          window.removeEventListener('pointerdown', unlock);
          window.removeEventListener('wheel', unlock);
          window.removeEventListener('keydown', unlock);
          window.removeEventListener('touchstart', unlock);
        }
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('wheel', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
    }
  }

  private ensureGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.connect(ctx.destination);
      this.masterGain = master;

      // Warm low-pass filter for mellow tea-room acoustic timbre
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1150, ctx.currentTime);
      filter.Q.setValueAtTime(0.7, ctx.currentTime);
      filter.connect(master);
      this.filterNode = filter;

      // Gentle stereo echo reverb network
      const dL = ctx.createDelay(1.5);
      const dR = ctx.createDelay(1.5);
      dL.delayTime.setValueAtTime(0.42, ctx.currentTime);
      dR.delayTime.setValueAtTime(0.64, ctx.currentTime);

      const fbL = ctx.createGain();
      const fbR = ctx.createGain();
      fbL.gain.setValueAtTime(0.32, ctx.currentTime);
      fbR.gain.setValueAtTime(0.28, ctx.currentTime);

      dL.connect(fbL);
      fbL.connect(dR);
      dR.connect(fbR);
      fbR.connect(dL);

      dL.connect(master);
      dR.connect(master);
      this.delayL = dL;
      this.delayR = dR;
    }
    return this.ctx;
  }

  private tryStartAudio(): void {
    const ctx = this.ensureGraph();
    if (!ctx || !this.masterGain) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.072, now + 1.2);

    if (!this.isRunning) {
      this.isRunning = true;
      this.scheduleLoop();
    }
  }

  private scheduleLoop(): void {
    if (this.timerId !== null) window.clearInterval(this.timerId);
    this.playStep();
    this.timerId = window.setInterval(() => {
      if (!this.isEnabled) return;
      this.playStep();
    }, 1450);
  }

  private playStep(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.filterNode || !this.delayL) return;

    const now = ctx.currentTime;
    const noteFreq = this.melodyNotes[this.stepIdx % this.melodyNotes.length];

    // 1. Soft Guqin / Guzheng plucked string note (sine + soft triangle overtone)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(noteFreq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(noteFreq * 2, now);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.14, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(0.42, now + 0.045);
    noteGain.gain.exponentialRampToValueAtTime(0.0008, now + 2.8);

    osc1.connect(noteGain);
    osc2.connect(overtoneGain);
    overtoneGain.connect(noteGain);

    noteGain.connect(this.filterNode);
    noteGain.connect(this.delayL);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.9);
    osc2.stop(now + 2.9);

    // 2. Warm breathing pad chord every 4 steps
    if (this.stepIdx % 4 === 0) {
      const rootFreq = this.bassRoots[(this.stepIdx / 4) % this.bassRoots.length];
      [rootFreq, rootFreq * 1.5].forEach((freq) => {
        const padOsc = ctx.createOscillator();
        const padGain = ctx.createGain();
        padOsc.type = 'sine';
        padOsc.frequency.setValueAtTime(freq, now);

        padGain.gain.setValueAtTime(0.0005, now);
        padGain.gain.linearRampToValueAtTime(0.16, now + 1.4);
        padGain.gain.exponentialRampToValueAtTime(0.0008, now + 5.6);

        padOsc.connect(padGain);
        padGain.connect(this.filterNode!);

        padOsc.start(now);
        padOsc.stop(now + 5.7);
      });
    }

    this.stepIdx++;
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    const ctx = this.ensureGraph();
    if (ctx && this.masterGain) {
      const now = ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      if (this.isEnabled) {
        this.tryStartAudio();
      } else {
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      }
    }
    this.notify();
    return this.isEnabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }
}

export const ambientBgm = new AmbientMusicController();

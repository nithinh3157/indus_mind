/**
 * Web Audio API Industrial Siren + SpeechSynthesis Voice Announcer
 * Plays a 4-second industrial siren and speaks clear operational status announcements.
 */
class AlertSirenEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private stopTimer: number | null = null;
  private voiceDelayTimer: number | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];
  private unlocked = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Browser requires an initial user interaction gesture to unlock audio
      });
    }
    return this.ctx;
  }

  public unlock(): boolean {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'running') {
      this.unlocked = true;
    }
    // Warm up speechSynthesis if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        // Ignore if unavailable
      }
    }
    return this.unlocked;
  }

  public speak(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.98;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors in unsupported headless environments
    }
  }

  /**
   * Automatically runs the industrial siren for 4 seconds (4000ms)
   * and announces "There is an issue" immediately upon siren completion.
   */
  public playDelaySirenAndVoice(
    durationMs = 4000,
    voiceMessage = 'There is an issue',
    onComplete?: () => void
  ): boolean {
    const ctx = this.ensureContext();
    this.stop();

    if (!ctx) {
      this.speak(voiceMessage);
      onComplete?.();
      return false;
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const durationSec = durationMs / 1000;

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const masterGain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(760, now);

    // 2.2 Hz sweep between 580 Hz and 940 Hz
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(2.2, now);
    lfoGain.gain.setValueAtTime(180, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.16, now + 0.08);
    masterGain.gain.setValueAtTime(0.16, Math.max(now + 0.1, now + durationSec - 0.15));
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + durationSec + 0.02);
    lfo.stop(now + durationSec + 0.02);

    this.isPlaying = true;
    this.activeOscillators = [osc, lfo];
    this.activeGains = [masterGain, lfoGain];

    this.voiceDelayTimer = window.setTimeout(() => {
      this.isPlaying = false;
      this.activeOscillators = [];
      this.activeGains = [];
      this.speak(voiceMessage);
      onComplete?.();
    }, durationMs);

    this.stopTimer = window.setTimeout(() => {
      this.isPlaying = false;
    }, durationMs + 50);

    return true;
  }

  public announceResolved(voiceMessage = 'Issue resolved'): void {
    this.stop();
    this.speak(voiceMessage);
  }

  public stop(): void {
    if (this.stopTimer !== null) {
      window.clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    if (this.voiceDelayTimer !== null) {
      window.clearTimeout(this.voiceDelayTimer);
      this.voiceDelayTimer = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Already stopped
      }
    });
    this.activeGains.forEach((g) => {
      try {
        g.disconnect();
      } catch {
        // Already disconnected
      }
    });
    this.activeOscillators = [];
    this.activeGains = [];
    this.isPlaying = false;
  }

  public getPlaying(): boolean {
    return this.isPlaying;
  }
}

export const alertSiren = new AlertSirenEngine();

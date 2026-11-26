class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playTone(freq: number, duration = 0.08, type: OscillatorType = 'triangle', volume = 0.06) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  public click() {
    this.playTone(520, 0.05, 'triangle', 0.05);
  }

  public success() {
    this.playTone(523.25, 0.09, 'triangle', 0.06);
    setTimeout(() => this.playTone(659.25, 0.09, 'triangle', 0.06), 70);
    setTimeout(() => this.playTone(783.99, 0.14, 'triangle', 0.07), 140);
  }

  public notify() {
    this.playTone(620, 0.08, 'sine', 0.05);
    setTimeout(() => this.playTone(780, 0.1, 'sine', 0.05), 80);
  }
}

export const sfx = new SoundEffects();

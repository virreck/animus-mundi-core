// src/ui/audio.ts
// Zero-asset procedural synth engine: every sound is generated live with the Web Audio API.

export const ThaumaturgicAudio = {
  ctx: null as AudioContext | null,
  enabled: true,
  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  playTone(freq: number, type: OscillatorType = 'sine', duration = 0.08, vol = 0.06, slideTo: number | null = null) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch { /* ignore */ }
  },
  keyClick() { this.playTone(820 + Math.random() * 240, 'triangle', 0.025, 0.025); },
  typewriterClack() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1950 + Math.random() * 450, now);
      filter.Q.setValueAtTime(2.8, now);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.24, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      whiteNoise.start(now);
      this.playTone(1350 + Math.random() * 250, 'square', 0.022, 0.055, 320);
    } catch { /* ignore */ }
  },
  heavyStampImpact() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(155, now);
      subOsc.frequency.exponentialRampToValueAtTime(26, now + 0.45);
      subGain.gain.setValueAtTime(0.38, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.48);

      const crunchOsc = this.ctx.createOscillator();
      const crunchGain = this.ctx.createGain();
      crunchOsc.type = 'sawtooth';
      crunchOsc.frequency.setValueAtTime(220, now);
      crunchOsc.frequency.exponentialRampToValueAtTime(42, now + 0.25);
      crunchGain.gain.setValueAtTime(0.18, now);
      crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      crunchOsc.connect(crunchGain);
      crunchGain.connect(this.ctx.destination);
      crunchOsc.start(now);
      crunchOsc.stop(now + 0.26);
    } catch { /* ignore */ }
  },
  scryPing() {
    this.playTone(1120, 'sine', 0.32, 0.08, 560);
    setTimeout(() => this.playTone(1490, 'sine', 0.22, 0.05), 110);
  },
  senseSweep() {
    [330, 440, 554, 659].forEach((f, i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.07, 0.04), i * 50));
  },
  sealSuccess() {
    [440, 554.37, 659.25, 880].forEach((f, i) => setTimeout(() => this.playTone(f, 'triangle', 0.22, 0.09), i * 65));
  },
  errorBuzz() { this.playTone(135, 'sawtooth', 0.24, 0.09, 80); }
};

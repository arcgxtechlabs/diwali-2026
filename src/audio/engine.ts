/**
 * Procedural audio engine. Everything is synthesised with the Web Audio API:
 * a tanpura-like drone, tabla patterns, bansuri flute phrases, arrows, roars,
 * maces, explosions and the dawn chord. No audio files are shipped.
 */
type Part = [ratio: number, gain: number, dur: number, type?: OscillatorType];

class AudioEngine {
  ac: AudioContext | null = null;
  master: GainNode | null = null;
  muted = false;
  private noise: AudioBuffer | null = null;
  private beat: number | null = null;
  private drone: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbSend: GainNode | null = null;

  init() {
    if (this.ac) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ac = new AC();
    const ac = this.ac;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.master = ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(comp); comp.connect(ac.destination);
    // white noise bed for percussive and wind sounds
    this.noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // cheap synthetic reverb (exponentially decaying noise impulse)
    const ir = ac.createBuffer(2, ac.sampleRate * 2.4, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 2.6); }
    this.reverb = ac.createConvolver(); this.reverb.buffer = ir; this.reverbSend = ac.createGain(); this.reverbSend.gain.value = 0.22; this.reverbSend.connect(this.reverb); this.reverb.connect(this.master);
    this.startDrone();
  }
  resume() { if (this.ac && this.ac.state === 'suspended') this.ac.resume(); }
  private out(pan = 0, wet = 0.3) {
    const ac = this.ac!; const g = ac.createGain();
    if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(this.master!); if (this.reverbSend && wet > 0) { const s = ac.createGain(); s.gain.value = wet; p.connect(s); s.connect(this.reverbSend); } }
    else g.connect(this.master!);
    return g;
  }
  private startDrone() {
    const ac = this.ac!; const g = ac.createGain(); g.gain.value = 0; g.connect(this.master!);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480; lp.connect(g);
    [73.42, 110, 146.83, 220].forEach((f, i) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = (i - 1.5) * 4; const og = ac.createGain(); og.gain.value = [0.5, 0.32, 0.26, 0.1][i]; o.connect(og); og.connect(lp); o.start(); });
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.12; const lg = ac.createGain(); lg.gain.value = 140; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    g.gain.linearRampToValueAtTime(0.05, ac.currentTime + 4); this.drone = g; this.droneFilter = lp;
  }
  /** Mood 0 (calm night) .. 1 (battle): opens the drone filter and raises its level. */
  mood(k: number) { if (!this.ac || !this.drone || !this.droneFilter) return; const t = this.ac.currentTime; this.drone.gain.setTargetAtTime(0.05 + 0.05 * k, t, 0.8); this.droneFilter.frequency.setTargetAtTime(480 + 900 * k, t, 0.8); }
  tone(freq: number, gain: number, pan: number, when: number, parts: Part[]) {
    if (!this.ac) return; const ac = this.ac, t = ac.currentTime + when, out = this.out(pan);
    parts.forEach(([r, g, dur, type]) => { const o = ac.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq * r; const e = ac.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(gain * g, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(e); e.connect(out); o.start(t); o.stop(t + dur + 0.05); });
  }
  pluck(f: number, g = 0.22, pan = 0, when = 0) { this.tone(f, g, pan, when, [[1, 1, 2.6], [2, 0.45, 1.6], [3, 0.25, 1.1], [4.07, 0.1, 0.7]]); }
  flute(freq: number, when = 0, len = 0.5, gain = 0.07) {
    if (!this.ac) return; const ac = this.ac, t = ac.currentTime + when, out = this.out(-0.3, 0.5);
    const o = ac.createOscillator(); o.frequency.value = freq; const v = ac.createOscillator(); v.frequency.value = 5.2; const vg = ac.createGain(); vg.gain.value = 4; v.connect(vg); vg.connect(o.frequency);
    const e = ac.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(gain, t + 0.08); e.gain.setValueAtTime(gain, t + len * 0.7); e.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2; const e2 = ac.createGain(); e2.gain.value = 0.12; o2.connect(e2); e2.connect(e);
    o.connect(e); e.connect(out); o.start(t); v.start(t); o2.start(t); o.stop(t + len + 0.1); v.stop(t + len + 0.1); o2.stop(t + len + 0.1);
  }
  chord(freqs: number[], gain = 0.12, len = 4) {
    if (!this.ac) return; const ac = this.ac, t = ac.currentTime, out = this.out(0, 0.6);
    freqs.forEach((f) => [-3, 3].forEach((dt) => { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = dt; const e = ac.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(gain / freqs.length, t + 0.4); e.gain.exponentialRampToValueAtTime(0.0001, t + len); o.connect(e); e.connect(out); o.start(t); o.stop(t + len + 0.1); }));
  }
  private noiseHit(t: number, gain: number, f1: number, f2: number, len: number, type: BiquadFilterType = 'bandpass', pan = 0) {
    const ac = this.ac!; const n = ac.createBufferSource(); n.buffer = this.noise; const bp = ac.createBiquadFilter(); bp.type = type; bp.frequency.setValueAtTime(f1, t); if (f2) bp.frequency.exponentialRampToValueAtTime(f2, t + len);
    const e = ac.createGain(); e.gain.setValueAtTime(gain, t); e.gain.exponentialRampToValueAtTime(0.0001, t + len); n.connect(bp); bp.connect(e); e.connect(this.out(pan)); n.start(t); n.stop(t + len + 0.05);
  }
  arrow(pan = 0) { if (!this.ac) return; const t = this.ac.currentTime; this.noiseHit(t, 0.14, 2500, 600, 0.22, 'bandpass', pan); this.tone(1800, 0.05, pan, 0, [[1, 1, 0.12]]); }
  bowDraw() { if (!this.ac) return; const t = this.ac.currentTime; this.noiseHit(t, 0.08, 300, 1800, 0.9, 'bandpass', -0.2); this.tone(110, 0.06, -0.2, 0, [[1, 1, 1.2, 'sawtooth'], [1.5, 0.4, 1.2, 'sine']]); }
  thud(pan = 0, big = false) {
    if (!this.ac) return; const ac = this.ac, t = ac.currentTime; const o = ac.createOscillator(); o.frequency.setValueAtTime(big ? 150 : 120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.5);
    const e = ac.createGain(); e.gain.setValueAtTime(big ? 0.55 : 0.35, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(e); e.connect(this.out(pan)); o.start(t); o.stop(t + 0.55); this.noiseHit(t, big ? 0.3 : 0.18, 900, 120, 0.25, 'lowpass', pan);
  }
  roar() {
    if (!this.ac) return; const ac = this.ac, t = ac.currentTime;
    for (let i = 0; i < 3; i++) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70 + i * 9, t); o.frequency.linearRampToValueAtTime(48 + i * 7, t + 1.4); const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(200, t + 1.4); const ws = ac.createWaveShaper(); const curve = new Float32Array(256); for (let k = 0; k < 256; k++) { const x = (k / 128) - 1; curve[k] = Math.tanh(x * 3); } ws.curve = curve; const e = ac.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.22, t + 0.1); e.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); o.connect(ws); ws.connect(lp); lp.connect(e); e.connect(this.out((i - 1) * 0.4, 0.7)); o.start(t); o.stop(t + 1.6); }
    this.noiseHit(t, 0.2, 200, 60, 1.2, 'lowpass', 0);
  }
  whoosh(pan = 0) { if (!this.ac) return; this.noiseHit(this.ac.currentTime, 0.18, 400, 4200, 0.38, 'bandpass', pan); }
  wings() { if (!this.ac) return; this.noiseHit(this.ac.currentTime, 0.07, 200, 700, 0.5, 'bandpass', -0.4); }
  boom(pan = 0, big = false) {
    if (!this.ac) return; const ac = this.ac, t = ac.currentTime; const o = ac.createOscillator(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.6);
    const e = ac.createGain(); e.gain.setValueAtTime(big ? 0.6 : 0.4, t); e.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 1.4 : 0.8)); o.connect(e); e.connect(this.out(pan, 0.8)); o.start(t); o.stop(t + 1.5);
    this.noiseHit(t, big ? 0.5 : 0.3, 1200, 80, big ? 1.1 : 0.6, 'lowpass', pan); this.noiseHit(t, 0.12, 6000, 1000, 0.25, 'highpass', pan);
  }
  crackle(pan = 0) { if (!this.ac) return; const t = this.ac.currentTime; for (let i = 0; i < 6; i++) this.noiseHit(t + Math.random() * 0.6, 0.05, 3000 + Math.random() * 3000, 800, 0.05, 'bandpass', pan + (Math.random() - 0.5) * 0.4); }
  shatter(pan = 0) { if (!this.ac) return; const t = this.ac.currentTime; this.boom(pan, true); for (let i = 0; i < 10; i++) this.noiseHit(t + Math.random() * 0.5, 0.08, 2000 + Math.random() * 4000, 500, 0.12, 'bandpass', (Math.random() - 0.5) * 1.4); }
  stomp(pan = 0) { if (!this.ac) return; const ac = this.ac, t = ac.currentTime; const o = ac.createOscillator(); o.frequency.setValueAtTime(60, t); o.frequency.exponentialRampToValueAtTime(28, t + 0.7); const e = ac.createGain(); e.gain.setValueAtTime(0.6, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); o.connect(e); e.connect(this.out(pan, 0.6)); o.start(t); o.stop(t + 1); this.noiseHit(t, 0.25, 500, 60, 0.5, 'lowpass', pan); }
  tabla(kind: string, t: number) {
    const ac = this.ac!, out = this.out(0, 0.15);
    if (kind === 'dha' || kind === 'ge') { const o = ac.createOscillator(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(62, t + 0.25); const e = ac.createGain(); e.gain.setValueAtTime(0.32, t); e.gain.exponentialRampToValueAtTime(0.001, t + 0.38); o.connect(e); e.connect(out); o.start(t); o.stop(t + 0.4); }
    if (kind === 'dha' || kind === 'na' || kind === 'tin') { const f = kind === 'tin' ? 660 : 520; const o = ac.createOscillator(); o.frequency.value = f; const o2 = ac.createOscillator(); o2.frequency.value = f * 2.01; const e = ac.createGain(); e.gain.setValueAtTime(kind === 'tin' ? 0.09 : 0.14, t); e.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'tin' ? 0.3 : 0.16)); o.connect(e); o2.connect(e); e.connect(out); o.start(t); o2.start(t); o.stop(t + 0.32); o2.stop(t + 0.32); this.noiseHit(t, 0.05, 3000, 0, 0.02, 'highpass', 0); }
  }
  startBeat(bpm: number, pat?: string[]) {
    if (!this.ac) return; this.stopBeat(); const pattern = pat || ['dha', 'na', 'na', 'dha', 'ge', 'na', 'tin', 'na']; const spb = 60 / bpm / 2; let next = this.ac.currentTime + 0.1, step = 0;
    this.beat = window.setInterval(() => { if (!this.ac) return; while (next < this.ac.currentTime + 0.12) { const k = pattern[step % pattern.length]; if (k) this.tabla(k, next); next += spb; step++; } }, 25);
  }
  stopBeat() { if (this.beat != null) { clearInterval(this.beat); this.beat = null; } }
  /** A short bansuri phrase in D (raga Bhupali-ish) for companion dialogue and the dawn. */
  phrase(kind: 'greet' | 'dawn' | 'sad' | 'win' = 'greet') {
    const D = 293.66, E = 329.63, Fs = 369.99, G = 392, A = 440, B = 493.88, D2 = 587.33, Fs2 = 739.99, A2 = 880;
    const seqs: Record<string, [number, number, number][]> = {
      greet: [[D2, 0, 0.4], [Fs2, 0.4, 0.7]],
      dawn: [[D, 0, 0.5], [E, 0.45, 0.4], [Fs, 0.85, 0.5], [A, 1.3, 0.6], [B, 1.85, 0.5], [D2, 2.3, 1.4]],
      sad: [[A, 0, 0.6], [G, 0.6, 0.6], [Fs, 1.2, 0.9], [D, 2.1, 1.6]],
      win: [[D2, 0, 0.3], [Fs2, 0.3, 0.3], [A2, 0.6, 0.3], [D2 * 2, 0.9, 1.2]],
    };
    seqs[kind].forEach(([f, w, l]) => this.flute(f, w, l, 0.08));
  }
  toggle() { this.muted = !this.muted; if (this.ac && this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ac.currentTime, 0.05); return this.muted; }
}

export const audio = new AudioEngine();
export const NOTES = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880, 987.77, 1174.66];

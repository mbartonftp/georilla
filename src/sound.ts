/* Sound effects synthesised with Web Audio, so there are no audio files to load. */
import { store } from "./store";

type Wave = OscillatorType;
const SCALE = [523.25, 659.25, 783.99, 1046.5, 1318.5];

class SoundBoard {
  private ac: AudioContext | null = null;
  private enabled = store.get("gr-sound", true);

  get on(): boolean { return this.enabled; }

  private ctx(): AudioContext | null {
    if (!this.ac) {
      try {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ac = new Ctor();
      } catch { return null; }
    }
    if (this.ac.state === "suspended") void this.ac.resume();
    return this.ac;
  }

  private tone(f: number, at: number, dur: number, type: Wave = "triangle", vol = .12, slide?: number): void {
    if (!this.enabled) return;
    const a = this.ctx(); if (!a) return;
    const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
  }

  toggle(): boolean { this.enabled = !this.enabled; store.set("gr-sound", this.enabled); if (this.enabled) this.tone(660, 0, .12); return this.enabled; }
  unlock(): void { if (this.enabled) this.ctx(); }
  rung(i: number): void { this.tone(SCALE[i], 0, .16, "triangle", .1); }
  land(t: number): void {
    this.tone(SCALE[t], 0, .4, "triangle", .14); this.tone(SCALE[t] * 1.5, .02, .4, "sine", .06);
    if (t === 4) [0, 1, 2, 3, 4, 3, 4].forEach((k, j) => this.tone(SCALE[k] * 2, .15 + j * .07, .22, "sine", .06));
  }
  wrong(): void { this.tone(220, 0, .14, "sawtooth", .05, 150); this.tone(165, .11, .2, "sawtooth", .045, 110); }
  unknown(): void { this.tone(340, 0, .08, "square", .03); this.tone(300, .08, .1, "square", .03); }
  tick(hi: boolean): void { this.tone(hi ? 1250 : 950, 0, .05, "square", .025); }
  countdown(go: boolean): void {
    if (go) { this.tone(523, 0, .12); this.tone(659, .08, .12); this.tone(1046, .16, .3); }
    else this.tone(440, 0, .12, "triangle", .1);
  }
  miss(): void { this.tone(392, 0, .2, "triangle", .08, 300); this.tone(294, .18, .35, "triangle", .07, 220); }
  count(): void { this.tone(880 + Math.random() * 200, 0, .04, "sine", .03); }
  key(): void { this.tone(1500 + Math.random() * 400, 0, .02, "sine", .012); }
  rank(): void { [0, 2, 4].forEach((k, j) => this.tone(SCALE[k], j * .09, .3, "triangle", .1)); }
}

export const Sound = new SoundBoard();
export const buzz = (p: number | number[]): void => { try { navigator.vibrate?.(p); } catch { /* not supported */ } };

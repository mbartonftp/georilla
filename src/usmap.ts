/* The USA game's map: a flat Albers map of the states seen through the same round porthole as the globe,
   with zoom-to-state, fills, dots, pins and drag to pan. Alaska, Hawaii and the territories sit where they really are,
   so the map flies out to them. */
import { geoBounds, geoCentroid, geoConicEqualArea, geoGraticule, geoPath } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import { easeCubicInOut } from "d3-ease";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, Geometry, MultiLineString } from "geojson";
import type { LonLat } from "./data";
import { hexA } from "./globe";
import type { Dot, MapView } from "./mapview";

type StateTopo = Topology<{ states: GeometryCollection<{ name: string }> }>;
type CountryTopo = Topology<{ countries: GeometryCollection<{ name: string }> }>;
interface View { c: LonLat; k: number }
interface Flight { t0: number; from: View; to: View; dur: number; dip: number; done: () => void }
interface Pin { ll: LonLat; color: string; label?: string; t0: number }

const LOWER48_SKIP = new Set(["Alaska", "Hawaii", "Puerto Rico", "Guam", "American Samoa", "United States Virgin Islands", "Commonwealth of the Northern Mariana Islands"]);
/** where to point for areas whose centroid is unhelpful */
const CENTER: Record<string, LonLat> = { "Florida": [-81.7, 28.3], "Michigan": [-84.9, 43.6], "Louisiana": [-92.2, 31], "Hawaii": [-157.3, 20.6], "Alaska": [-152, 63.5] };

export class UsMap implements MapView {
  readonly loaded: Promise<void>;
  private ctx: CanvasRenderingContext2D;
  private proj = geoConicEqualArea().parallels([29.5, 45.5]).rotate([96, 0]).precision(0.3);
  private path;
  private grat = geoGraticule().step([10, 5])();
  private W = 300; private R = 140; private dpr = 1; private base = 1;
  private home: View = { c: [-96, 38.5], k: 1 };
  private view: View = { c: [-96, 38.5], k: 1 };
  private anim: Flight | null = null; private active = false;
  private states: Record<string, Feature<Geometry>> = {}; private borders: MultiLineString | null = null;
  private world: Feature<Geometry>[] = [];
  private centers: Record<string, LonLat> = {}; private zooms: Record<string, number> = {};
  private fills = new Map<string, string>(); private dots: Dot[] = []; private pin: Pin | null = null;
  private flashing: { name: string; color: string; t0: number; until: number } | null = null;
  private dragging: { x: number; y: number; view: View } | null = null;
  private reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(private canvas: HTMLCanvasElement, private labelEl: HTMLElement, private baseUrl: string) {
    this.ctx = canvas.getContext("2d")!;
    this.path = geoPath(this.proj, this.ctx);
    addEventListener("resize", () => this.resize());
    this.bindDrag();
    requestAnimationFrame(t => this.frame(t));
    this.loaded = this.load();
  }

  resize(): void {
    this.W = this.canvas.clientWidth || 300; this.dpr = Math.min(2, devicePixelRatio || 1);
    this.canvas.width = Math.round(this.W * this.dpr); this.canvas.height = Math.round(this.W * this.dpr);
    this.R = this.W / 2 - 4;
  }

  private async load(): Promise<void> {
    try {
      const [us, w] = await Promise.all([
        fetch(this.baseUrl + "data/us-states-10m.json").then(r => r.json() as Promise<StateTopo>),
        fetch(this.baseUrl + "data/world-50m.json").then(r => r.json() as Promise<CountryTopo>)
      ]);
      const fs = feature(us, us.objects.states).features as Feature<Geometry, { name: string }>[];
      fs.forEach(f => { this.states[f.properties.name] = f; });
      this.borders = mesh(us, us.objects.states, (a, b) => a !== b);
      this.world = (feature(w, w.objects.countries).features as Feature<Geometry, { name: string }>[]).filter(f => f.properties.name !== "United States of America");
      // fit the lower 48 to the porthole
      const lower = { type: "FeatureCollection", features: fs.filter(f => !LOWER48_SKIP.has(f.properties.name)) } as const;
      this.proj.scale(1).translate([0, 0]);
      const [[x0, y0], [x1, y1]] = geoPath(this.proj).bounds(lower as GeoPermissibleObjects);
      this.base = 1.86 / Math.hypot(x1 - x0, (y1 - y0) * 0.9) ;
      this.home = { c: this.proj.invert!([(x0 + x1) / 2, (y0 + y1) / 2]) as LonLat, k: 1 };
      for (const [name, f] of Object.entries(this.states)) {
        this.centers[name] = CENTER[name] || (geoCentroid(f) as LonLat);
        const [[a, b], [c, d]] = geoPath(this.proj).bounds(f);
        this.zooms[name] = Math.max(0.55, Math.min(4.5, (1.1 / Math.max(c - a, d - b)) / (this.base)));
      }
      if (!this.anim) this.view = { ...this.home };
    } catch (e) { console.warn("US map data failed to load", e); }
  }

  /** set the projection for a view, so ll lands at the middle of the porthole */
  private apply(v: View): void {
    this.proj.scale(this.base * this.R * v.k).translate([0, 0]);
    const p = this.proj(v.c) || [0, 0];
    this.proj.translate([this.W / 2 - p[0], this.W / 2 - p[1]]);
  }
  private inside(x: number, y: number): boolean { return Math.hypot(x - this.W / 2, y - this.W / 2) < this.R - 2; }
  private draw(obj: GeoPermissibleObjects): void { this.ctx.beginPath(); this.path(obj); }

  private render(now: number): void {
    const { ctx, W, dpr, R } = this, c = W / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, W);
    let g = ctx.createRadialGradient(c, c, R * 0.92, c, c, R + 10);
    g.addColorStop(0, "rgba(110,220,255,.45)"); g.addColorStop(1, "rgba(110,220,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, R + 10, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.clip();
    g = ctx.createLinearGradient(0, 0, 0, W);
    g.addColorStop(0, "#1d7a96"); g.addColorStop(1, "#0d3f5c");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
    this.draw(this.grat); ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = .7; ctx.stroke();
    // neighbours, muted
    ctx.fillStyle = "#b9b08c";
    for (const f of this.world) { this.draw(f); ctx.fill(); }
    // the states
    ctx.fillStyle = "#eadcb0";
    for (const f of Object.values(this.states)) { this.draw(f); ctx.fill(); }
    for (const [name, col] of this.fills) { const f = this.states[name]; if (f) { this.draw(f); ctx.fillStyle = col; ctx.fill(); } }
    const fl = this.flashing;
    if (fl && now < fl.until && this.states[fl.name]) {
      const a = 0.5 + 0.5 * Math.sin((now - fl.t0) / 70);
      ctx.globalAlpha = .35 + .65 * a; this.draw(this.states[fl.name]); ctx.fillStyle = fl.color; ctx.fill(); ctx.globalAlpha = 1;
    }
    if (this.borders) { this.draw(this.borders); ctx.strokeStyle = "rgba(92,72,30,.55)"; ctx.lineWidth = .8; ctx.stroke(); }
    for (const d of this.dots) {
      const p = this.proj(d.ll); if (!p) continue;
      ctx.beginPath(); ctx.arc(p[0], p[1], 3.8, 0, Math.PI * 2); ctx.fillStyle = d.color; ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = "#0b2a20"; ctx.stroke();
    }
    // vignette
    g = ctx.createRadialGradient(c, c, R * .6, c, c, R);
    g.addColorStop(0, "rgba(0,10,20,0)"); g.addColorStop(1, "rgba(0,10,20,.35)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
    ctx.restore();
    ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1.2; ctx.stroke();
    // pin
    let showLabel = false;
    const p = this.pin, pp = p && this.proj(p.ll);
    if (p && pp && this.inside(pp[0], pp[1])) {
      const [x, y] = pp, t = ((now - p.t0) % 1400) / 1400;
      ctx.beginPath(); ctx.arc(x, y, 5 + t * 22, 0, Math.PI * 2); ctx.strokeStyle = hexA(p.color, 1 - t); ctx.lineWidth = 2.5; ctx.stroke();
      const drop = Math.max(0, 1 - (now - p.t0) / 380), py = y - 16 - drop * 40;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, py + 4); ctx.arc(x, py, 8, Math.PI * .8, Math.PI * .2); ctx.closePath();
      ctx.fillStyle = p.color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#0b2a20"; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, py, 3, 0, Math.PI * 2); ctx.fillStyle = "#0b2a20"; ctx.fill();
      if (p.label) { this.labelEl.style.left = x + "px"; this.labelEl.style.top = (py - 2) + "px"; showLabel = true; }
    }
    this.labelEl.hidden = !showLabel;
  }

  private frame(now: number): void {
    if (this.active) {
      const a = this.anim;
      if (a) {
        const t = Math.min(1, (now - a.t0) / a.dur), e = easeCubicInOut(t);
        const lk = Math.log(a.from.k) + (Math.log(a.to.k) - Math.log(a.from.k)) * e;
        this.view = { c: [a.from.c[0] + (a.to.c[0] - a.from.c[0]) * e, a.from.c[1] + (a.to.c[1] - a.from.c[1]) * e], k: Math.exp(lk) * (1 - a.dip * Math.sin(Math.PI * t)) };
        if (t >= 1) { this.anim = null; this.view = a.to; a.done(); }
      }
      this.apply(this.view);
      this.render(now);
    }
    requestAnimationFrame(t => this.frame(t));
  }

  private fly(to: View, opts: { dur?: number } = {}): Promise<void> {
    const from = { c: [...this.view.c] as LonLat, k: this.view.k };
    const dist = Math.hypot(to.c[0] - from.c[0], to.c[1] - from.c[1]) + Math.abs(Math.log(to.k / from.k)) * 10;
    return new Promise(done => {
      if (this.reduce || !this.active) { this.view = to; return done(); }
      this.anim = { t0: performance.now(), from, to, dur: opts.dur || Math.min(1500, 500 + dist * 12), dip: dist > 25 ? 0.35 : 0.06, done };
    });
  }

  private bindDrag(): void {
    const cv = this.canvas;
    cv.addEventListener("pointerdown", e => { this.dragging = { x: e.clientX, y: e.clientY, view: { ...this.view } }; cv.setPointerCapture(e.pointerId); this.anim = null; });
    cv.addEventListener("pointermove", e => {
      const d = this.dragging; if (!d) return;
      this.apply(d.view);
      const ll = this.proj.invert!([this.W / 2 - (e.clientX - d.x), this.W / 2 - (e.clientY - d.y)]);
      if (ll) this.view = { c: [Math.max(-180, Math.min(-50, ll[0])), Math.max(10, Math.min(72, ll[1]))], k: d.view.k };
    });
    const end = () => { this.dragging = null; };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  }

  setActive(on: boolean): void { this.active = on; this.canvas.hidden = !on; if (on) this.resize(); }
  /** the flat map doesn't spin; going back to idle drifts home */
  setSpin(on: boolean): void { if (on && !this.dragging) void this.fly(this.home); }
  setFills(map: Iterable<[string, string]>): void { this.fills = new Map(map); }
  setDots(dots: Dot[]): void { this.dots = dots; }
  clear(): void { this.fills = new Map(); this.dots = []; this.pin = null; this.flashing = null; }
  unfocus(): void { this.pin = null; }
  center(name: string | null | undefined): LonLat | null { return (name && this.centers[name]) || null; }
  focus(name: string | null | undefined, color: string, label?: string, at?: LonLat): void {
    const ll = at || this.center(name);
    this.pin = ll ? { ll, color, label, t0: performance.now() } : null;
    if (label) { this.labelEl.textContent = label; this.labelEl.classList.remove("bad"); }
  }
  flash(name: string, color: string, label?: string, at?: LonLat): Promise<void> {
    const ll = at || this.center(name); if (!ll) return Promise.resolve();
    const now = performance.now();
    this.flashing = { name, color, t0: now, until: now + 1400 };
    this.pin = { ll, color, label, t0: now };
    this.labelEl.textContent = label || name; this.labelEl.classList.add("bad");
    return this.flyToName(name, { dur: 650 }, at);
  }
  flyToName(name: string | null | undefined, opts?: { dur?: number }, at?: LonLat): Promise<void> {
    const c = at || this.center(name);
    if (!c) return Promise.resolve();
    return this.fly({ c, k: (name && this.zooms[name]) || 2.5 }, opts);
  }
  /** fit a group of states into view */
  flyToMany(names: string[], opts?: { dur?: number }): Promise<void> {
    const fs = names.map(n => this.states[n]).filter(Boolean);
    if (!fs.length) return this.fly(this.home, opts);
    const [[w, s], [e, n]] = geoBounds({ type: "FeatureCollection", features: fs } as never);
    if (e - w > 80 || w > e) return this.fly(this.home, opts); // spread wide (or across the dateline): the whole country
    const c: LonLat = [(w + e) / 2, (s + n) / 2];
    this.proj.scale(1).translate([0, 0]);
    const [[x0, y0], [x1, y1]] = geoPath(this.proj).bounds({ type: "FeatureCollection", features: fs } as never);
    const k = Math.max(0.5, Math.min(4, (1.2 / Math.max(x1 - x0, y1 - y0)) / this.base));
    this.apply(this.view);
    return this.fly({ c, k }, opts);
  }
}

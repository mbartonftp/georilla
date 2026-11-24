/* Georilla globe: an orthographic globe drawn on canvas, with fly-to, country fills, pins and drag-to-spin. */
import { geoCentroid, geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import { easeCubicInOut } from "d3-ease";
import { feature, merge, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, Geometry, MultiLineString, MultiPolygon } from "geojson";
import { ATLAS_NAME, COUNTRIES } from "./data";

export type LonLat = [number, number];

// where to point for countries whose shape centroid lands somewhere unhelpful (overseas parts, dateline, missing shape)
const CENTER: Record<string, LonLat> = {
  "France": [2.5, 46.6], "United States": [-98, 39.5], "Russia": [95, 62], "Canada": [-100, 58], "Netherlands": [5.3, 52.2],
  "Norway": [10, 62], "Denmark": [10, 56], "United Kingdom": [-2, 54], "Portugal": [-8.2, 39.6], "Spain": [-3.7, 40.3],
  "Ecuador": [-78.5, -1.5], "Chile": [-71, -35], "Malaysia": [109, 4], "Indonesia": [118, -2], "Kiribati": [173, 1.4],
  "Fiji": [178, -17.8], "Tuvalu": [179.2, -8.5], "Equatorial Guinea": [10.3, 1.6], "New Zealand": [173, -41], "Japan": [138, 37],
  "Australia": [134, -25], "Greece": [22, 39], "Italy": [12.5, 42.5], "Yemen": [47.5, 15.5], "Seychelles": [55.5, -4.6],
  "Maldives": [73.5, 3.2], "Micronesia": [158.2, 6.9], "Marshall Islands": [171.2, 7.1], "Bahamas": [-77.4, 24.7]
};

interface Pin { ll: LonLat; color: string; label?: string; t0: number }
interface Flight { t0: number; from: LonLat; d: LonLat; dur: number; dip: number; done: () => void }
type CountryTopo = Topology<{ countries: GeometryCollection<{ name: string }> }>;

export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, a).toFixed(3)})`;
}

export class Globe {
  readonly loaded: Promise<void>;
  private ctx: CanvasRenderingContext2D;
  private proj = geoOrthographic().clipAngle(90).precision(0.6);
  private path;
  private grat = geoGraticule10();
  private W = 300; private R = 140; private dpr = 1; private zoom = 1;
  private rot: [number, number, number] = [-15, -25, 0];
  private spin = true; private anim: Flight | null = null; private last = performance.now();
  private land: MultiPolygon | null = null; private borders: MultiLineString | null = null;
  private shapes: Record<string, Feature<Geometry>> = {}; private centers: Record<string, LonLat> = {};
  private fills = new Map<string, string>(); private pin: Pin | null = null;
  private flashing: { name: string; color: string; t0: number; until: number } | null = null;
  private dragging: { x: number; y: number; rot: [number, number, number] } | null = null;
  private reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(private canvas: HTMLCanvasElement, private labelEl: HTMLElement, private baseUrl: string) {
    this.ctx = canvas.getContext("2d")!;
    this.path = geoPath(this.proj, this.ctx);
    addEventListener("resize", () => this.resize());
    this.bindDrag();
    this.resize();
    requestAnimationFrame(t => this.frame(t));
    this.loaded = this.load();
  }

  resize(): void {
    this.W = this.canvas.clientWidth || 300; this.dpr = Math.min(2, devicePixelRatio || 1);
    this.canvas.width = Math.round(this.W * this.dpr); this.canvas.height = Math.round(this.W * this.dpr);
    this.R = this.W / 2 - 4; this.proj.translate([this.W / 2, this.W / 2]);
  }

  private async load(): Promise<void> {
    try {
      const get = (f: string) => fetch(this.baseUrl + "data/" + f).then(r => r.json() as Promise<CountryTopo>);
      const [w110, w50] = await Promise.all([get("world-110m.json"), get("world-50m.json")]);
      this.land = merge(w110, w110.objects.countries.geometries as never);
      this.borders = mesh(w110, w110.objects.countries, (a, b) => a !== b);
      const byAtlas: Record<string, Feature<Geometry>> = {};
      feature(w50, w50.objects.countries).features.forEach(f => { byAtlas[f.properties.name] = f; });
      COUNTRIES.forEach(c => {
        const f = byAtlas[ATLAS_NAME[c.name] || c.name];
        if (f) this.shapes[c.name] = f;
        const ll = CENTER[c.name] || (f ? (geoCentroid(f) as LonLat) : null);
        if (ll) this.centers[c.name] = ll;
      });
    } catch (e) { console.warn("Map data failed to load", e); }
  }

  center(name: string | null | undefined): LonLat | null { return (name && this.centers[name]) || null; }
  private visible(ll: LonLat): boolean { return geoDistance(ll, [-this.rot[0], -this.rot[1]]) < Math.PI / 2 - 0.08; }
  private draw(obj: GeoPermissibleObjects): void { this.ctx.beginPath(); this.path(obj); }

  private render(now: number): void {
    const { ctx, W, dpr } = this, c = W / 2, r = this.R * this.zoom, sphere = { type: "Sphere" } as const;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, W);
    // atmosphere
    let g = ctx.createRadialGradient(c, c, r * 0.92, c, c, r + 10);
    g.addColorStop(0, "rgba(110,220,255,.45)"); g.addColorStop(1, "rgba(110,220,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, r + 10, 0, Math.PI * 2); ctx.fill();
    // ocean
    g = ctx.createRadialGradient(c - r * .35, c - r * .4, r * .05, c, c, r);
    g.addColorStop(0, "#3aa7c4"); g.addColorStop(.55, "#136079"); g.addColorStop(1, "#0a2f47");
    ctx.fillStyle = g; this.draw(sphere); ctx.fill();
    this.draw(this.grat); ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = .7; ctx.stroke();
    if (this.land && this.borders) {
      this.draw(this.land); ctx.fillStyle = "#eadcb0"; ctx.fill();
      for (const [name, col] of this.fills) { const f = this.shapes[name]; if (f) { this.draw(f); ctx.fillStyle = col; ctx.fill(); } }
      const fl = this.flashing;
      if (fl && now < fl.until && this.shapes[fl.name]) {
        const a = 0.5 + 0.5 * Math.sin((now - fl.t0) / 70);
        ctx.globalAlpha = .35 + .65 * a; this.draw(this.shapes[fl.name]); ctx.fillStyle = fl.color; ctx.fill(); ctx.globalAlpha = 1;
      }
      this.draw(this.borders); ctx.strokeStyle = "rgba(92,72,30,.4)"; ctx.lineWidth = .6; ctx.stroke();
      // dots so tiny countries still show
      for (const [name, col] of this.fills) {
        const ll = this.centers[name]; if (!ll || !this.visible(ll)) continue;
        const [x, y] = this.proj(ll)!; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = "rgba(10,30,20,.6)"; ctx.stroke();
      }
    }
    // shading for depth
    g = ctx.createRadialGradient(c - r * .4, c - r * .45, r * .2, c, c, r * 1.02);
    g.addColorStop(0, "rgba(255,255,255,.12)"); g.addColorStop(.6, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,10,20,.45)");
    ctx.fillStyle = g; this.draw(sphere); ctx.fill();
    this.draw(sphere); ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1.2; ctx.stroke();
    // pin
    let showLabel = false;
    const p = this.pin;
    if (p && this.visible(p.ll)) {
      const [x, y] = this.proj(p.ll)!, t = ((now - p.t0) % 1400) / 1400;
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
    const dt = Math.min(60, now - this.last); this.last = now;
    const a = this.anim;
    if (a) {
      const t = Math.min(1, (now - a.t0) / a.dur), e = easeCubicInOut(t);
      this.rot = [a.from[0] + a.d[0] * e, a.from[1] + a.d[1] * e, 0];
      this.zoom = 1 - a.dip * Math.sin(Math.PI * t);
      if (t >= 1) { this.anim = null; this.zoom = 1; a.done(); }
    } else if (this.spin && !this.dragging && !this.reduce) this.rot[0] += dt * 0.008;
    this.proj.rotate(this.rot).scale(this.R * this.zoom);
    this.render(now);
    requestAnimationFrame(t => this.frame(t));
  }

  private flyTo(ll: LonLat | null, opts: { dur?: number } = {}): Promise<void> {
    if (!ll) return Promise.resolve();
    this.spin = false;
    const to: LonLat = [-ll[0], Math.max(-55, Math.min(55, -ll[1]))];
    const from: LonLat = [this.rot[0], this.rot[1]];
    const d: LonLat = [((to[0] - from[0]) % 360 + 540) % 360 - 180, to[1] - from[1]];
    const ang = Math.hypot(d[0], d[1]);
    return new Promise(done => {
      if (this.reduce) { this.rot = [to[0], to[1], 0]; return done(); }
      this.anim = { t0: performance.now(), from, d, dur: opts.dur || Math.min(1500, 500 + ang * 6), dip: ang > 40 ? 0.14 : 0.04, done };
    });
  }

  private bindDrag(): void {
    const cv = this.canvas;
    cv.addEventListener("pointerdown", e => { this.dragging = { x: e.clientX, y: e.clientY, rot: [...this.rot] }; cv.setPointerCapture(e.pointerId); this.anim = null; });
    cv.addEventListener("pointermove", e => {
      const d = this.dragging; if (!d) return;
      const k = 60 / this.R;
      this.rot = [d.rot[0] + (e.clientX - d.x) * k, Math.max(-70, Math.min(70, d.rot[1] - (e.clientY - d.y) * k)), 0];
    });
    const end = () => { this.dragging = null; };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  }

  setSpin(on: boolean): void { this.spin = on; }
  setFills(map: Iterable<[string, string]>): void { this.fills = new Map(map); }
  clear(): void { this.fills = new Map(); this.pin = null; this.flashing = null; }
  unfocus(): void { this.pin = null; }
  focus(name: string | null | undefined, color: string, label?: string): void {
    const ll = this.center(name);
    this.pin = ll ? { ll, color, label, t0: performance.now() } : null;
    if (label) { this.labelEl.textContent = label; this.labelEl.classList.remove("bad"); }
  }
  flash(name: string, color: string, label?: string): Promise<void> {
    const ll = this.center(name); if (!ll) return Promise.resolve();
    const now = performance.now();
    this.flashing = { name, color, t0: now, until: now + 1400 };
    this.pin = { ll, color, label, t0: now };
    this.labelEl.textContent = label || name; this.labelEl.classList.add("bad");
    return this.flyTo(ll, { dur: 650 });
  }
  flyToName(name: string | null | undefined, opts?: { dur?: number }): Promise<void> { return this.flyTo(this.center(name), opts); }
  /** Fly to the middle of a group of countries, so a whole answer set comes into view. */
  flyToMany(names: string[], opts?: { dur?: number }): Promise<void> {
    let x = 0, y = 0, z = 0, n = 0;
    names.forEach(nm => {
      const ll = this.center(nm); if (!ll) return;
      const l = ll[0] * Math.PI / 180, p = ll[1] * Math.PI / 180;
      x += Math.cos(p) * Math.cos(l); y += Math.cos(p) * Math.sin(l); z += Math.sin(p); n++;
    });
    if (!n || Math.hypot(x, y, z) / n < 0.25) { this.spin = true; return Promise.resolve(); } // spread round the world: just spin
    return this.flyTo([Math.atan2(y, x) * 180 / Math.PI, Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI], opts);
  }
}

/* What the game needs from a map. The globe (world and capitals games) and the US map (USA game) both provide it.
   Areas are named the way the data names them: countries on the globe, states on the US map. */
import type { LonLat } from "./data";

export interface Dot { ll: LonLat; color: string }

export interface MapView {
  readonly loaded: Promise<void>;
  /** show or hide this map; a hidden map stops drawing */
  setActive(on: boolean): void;
  setSpin(on: boolean): void;
  setFills(map: Iterable<[string, string]>): void;
  /** small markers at exact spots (cities, parks, capitals) */
  setDots(dots: Dot[]): void;
  clear(): void;
  unfocus(): void;
  /** drop the pin on an area, or on an exact spot inside it */
  focus(area: string | null | undefined, color: string, label?: string, at?: LonLat): void;
  flash(area: string, color: string, label?: string, at?: LonLat): Promise<void>;
  flyToName(area: string | null | undefined, opts?: { dur?: number }, at?: LonLat): Promise<void>;
  flyToMany(areas: string[], opts?: { dur?: number }): Promise<void>;
}

/* Checks the hand-made "lines on the map" lists against real country shapes from world-atlas (Natural Earth 1:50m). */
import { readFileSync } from "node:fs";
import { feature, neighbors } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, Geometry, Position } from "geojson";
import { describe, expect, it } from "vitest";
import { ATLAS_NAME, COUNTRIES, FEATURES, NEIGHBOURS } from "../src/data";

type CountryTopo = Topology<{ countries: GeometryCollection<{ name: string }> }>;
const topo = JSON.parse(readFileSync(new URL("../public/data/world-50m.json", import.meta.url), "utf8")) as CountryTopo;
const shapes = feature(topo, topo.objects.countries).features as Feature<Geometry, { name: string }>[];

/** map shapes that belong to one of our countries under another name */
const PART_OF: Record<string, string> = { "Greenland": "Denmark", "Faeroe Is.": "Denmark", "Somaliland": "Somalia", "N. Cyprus": "Cyprus" };
const ours = new Map<string, string>();
for (const c of COUNTRIES) ours.set(ATLAS_NAME[c.name] || c.name, c.name);
for (const [k, v] of Object.entries(PART_OF)) ours.set(k, v);

/** each polygon's outer ring, per country */
const rings = new Map<string, Position[][]>();
for (const f of shapes) {
  const name = ours.get(f.properties.name);
  if (!name || !f.geometry) continue;
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [];
  rings.set(name, [...(rings.get(name) || []), ...polys.map(p => p[0])]);
}

/** does some single landmass of the country reach both sides of the line? */
function crosses(name: string, axis: 0 | 1, value: number): boolean {
  return (rings.get(name) || []).some(ring => {
    const xs = ring.map(p => p[axis]);
    const lo = Math.min(...xs), hi = Math.max(...xs);
    if (axis === 0 && hi - lo > 180) return false; // wraps the antimeridian
    return lo < value && hi > value;
  });
}

const LINES: { id: string; axis: 0 | 1; value: number; /** listed because of waters or islets too small for the map */ waters?: string[]; /** cross on the map but left out on purpose */ skip?: string[] }[] = [
  { id: "line-equator", axis: 1, value: 0, waters: ["Maldives", "Kiribati", "São Tomé and Príncipe"] },
  { id: "line-cancer", axis: 1, value: 23.4363, skip: ["Morocco"] /* the map draws Western Sahara inside Morocco */ },
  { id: "line-capricorn", axis: 1, value: -23.4363 },
  { id: "line-arctic-circle", axis: 1, value: 66.5637, waters: ["Iceland"] },
  { id: "line-prime-meridian", axis: 0, value: 0 }
];

describe("lines on the map match real shapes", () => {
  it("has every country's shape", () => {
    const missing = COUNTRIES.filter(c => !rings.has(c.name)).map(c => c.name);
    // tiny island states missing at 1:50m
    expect(missing.filter(n => !["Tuvalu"].includes(n))).toEqual([]);
  });
  for (const line of LINES) {
    const f = FEATURES.find(x => x.id === line.id)!;
    it(`${line.id}: every listed country crosses it`, () => {
      const bad = f.members.filter(m => !line.waters?.includes(m) && !crosses(m, line.axis, line.value));
      expect(bad).toEqual([]);
    });
    it(`${line.id}: no country that crosses it is missing`, () => {
      const missing = COUNTRIES.map(c => c.name).filter(n => crosses(n, line.axis, line.value) && !f.members.includes(n) && !line.skip?.includes(n));
      expect(missing).toEqual([]);
    });
  }
});

describe("land borders match real shapes", () => {
  // countries are neighbours on the map when their shapes share an edge
  const geoms = topo.objects.countries.geometries;
  const adj = neighbors(geoms as never);
  const mapNeighbours = new Map<string, Set<string>>();
  geoms.forEach((g, i) => {
    const a = ours.get((g.properties as { name: string }).name);
    if (!a) return;
    for (const j of adj[i]) {
      const b = ours.get((geoms[j].properties as { name: string }).name);
      if (b && b !== a) mapNeighbours.set(a, (mapNeighbours.get(a) || new Set()).add(b));
    }
  });
  /** pairs the 1:50m map can't show (too small to share an edge) or draws differently */
  const MAP_LIMITS = [
    "Botswana / Zambia", // a ~150 m border at Kazungula
    "Morocco / Spain", // Ceuta and Melilla
    "France / Netherlands" // Saint Martin, drawn as separate territories
  ];
  const pairs = (m: Map<string, Iterable<string>>) => new Set([...m].flatMap(([a, bs]) => [...bs].map(b => [a, b].sort().join(" / "))));

  it("every border in the data is on the map", () => {
    const data = pairs(new Map(Object.entries(NEIGHBOURS)));
    const map = pairs(mapNeighbours);
    expect([...data].filter(p => !map.has(p) && !MAP_LIMITS.includes(p))).toEqual([]);
  });
  it("every border on the map is in the data", () => {
    const data = pairs(new Map(Object.entries(NEIGHBOURS)));
    const map = pairs(mapNeighbours);
    expect([...map].filter(p => !data.has(p) && !MAP_LIMITS.includes(p))).toEqual([]);
  });
});

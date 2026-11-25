/* The USA and capitals games: their data, prompts, matching and daily sets. */
import { readFileSync } from "node:fs";
import { feature, neighbors } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { geoContains } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import { describe, expect, it } from "vitest";
import { CAPITAL_LL, CAP_P, COUNTRIES, KNOWN_US, US_P, US_PLACES, VIEWS, answersFor, judge } from "../src/data";
import { VIEW_PROBLEMS } from "../src/data/popularity.gen";
import { DC, PARKS, STATES, STATE_BY_ABBR } from "../src/data/us";
import { STATE_POP, US_CITIES } from "../src/data/us.gen";
import { MODES, seedFor } from "../src/modes";
import { ROUNDS, pickSet, shareText } from "../src/rules";

const dupes = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);
const prompt = (pool: typeof US_P, id: string) => { const p = pool.find(x => x.id === id); if (!p) throw new Error(`no prompt ${id}`); return p; };

type StateTopo = Topology<{ states: GeometryCollection<{ name: string }> }>;
const topo = JSON.parse(readFileSync(new URL("../public/data/us-states-10m.json", import.meta.url), "utf8")) as StateTopo;
const shapes = feature(topo, topo.objects.states).features as Feature<Geometry, { name: string }>[];
const shape = new Map(shapes.map(f => [f.properties.name, f]));

describe("US states", () => {
  it("has the 50 states once each, with capitals and populations", () => {
    expect(STATES).toHaveLength(50);
    expect(dupes(STATES.map(s => s.abbr))).toEqual([]);
    for (const s of STATES) {
      expect(shape.has(s.name), s.name).toBe(true);
      expect(STATE_POP[s.name], s.name).toBeGreaterThan(500_000);
    }
  });
  it("has symmetric borders", () => {
    for (const s of STATES) {
      for (const a of s.land) expect(STATE_BY_ABBR.get(a)!.land, `${s.abbr} → ${a}`).toContain(s.abbr);
      for (const a of s.water) expect(STATE_BY_ABBR.get(a)!.water, `${s.abbr} → ${a}`).toContain(s.abbr);
    }
  });
  it("lists exactly the land borders the map shapes share", () => {
    const geoms = topo.objects.states.geometries, nb = neighbors(geoms as never);
    const ours = new Set(STATES.map(s => s.name));
    for (const s of STATES) {
      const i = geoms.findIndex(g => (g.properties as { name: string }).name === s.name);
      const onMap = nb[i].map(j => (geoms[j].properties as { name: string }).name).filter(n => ours.has(n) && n !== s.name).sort();
      const listed = s.land.map(a => STATE_BY_ABBR.get(a)!.name).sort();
      expect(listed, s.name).toEqual(onMap);
    }
  });
  it("has a census population for every capital, sitting inside its state", () => {
    for (const s of STATES) {
      const c = US_CITIES.find(x => x.state === s.name && x.name === s.capital);
      expect(c, s.capital).toBeDefined();
      expect(geoContains(shape.get(s.name)!, c!.ll), `${s.capital}, ${s.name}`).toBe(true);
    }
  });
});

describe("US cities and parks", () => {
  it("puts every city inside its state", () => {
    // the 1:10m outlines are coarse, so a city on the shore can fall just outside: allow a little slack
    const near = (st: string, ll: [number, number]) => geoContains(shape.get(st)!, ll) ||
      [[0.15, 0], [-0.15, 0], [0, 0.15], [0, -0.15]].some(([dx, dy]) => geoContains(shape.get(st)!, [ll[0] + dx, ll[1] + dy]));
    for (const c of US_CITIES) expect(near(c.state, c.ll), `${c.name}, ${c.state}`).toBe(true);
  });
  it("includes the big ones", () => {
    const names = new Set(US_CITIES.map(c => c.name));
    for (const n of ["New York", "Los Angeles", "Chicago", "Houston", "Honolulu", "Nashville", "Louisville", "Boise", "Washington"]) expect(names.has(n), n).toBe(true);
    expect(US_CITIES.find(c => c.name === "Washington")!.state).toBe(DC);
  });
  it("has the 63 national parks, each inside its first state", () => {
    expect(PARKS).toHaveLength(63);
    expect(dupes(PARKS.map(p => p.name))).toEqual([]);
    const area = (a: string) => STATE_BY_ABBR.get(a)?.name || { AS: "American Samoa", VI: "United States Virgin Islands" }[a]!;
    for (const p of PARKS) expect(geoContains(shape.get(area(p.states[0]))!, p.ll) || ["Dry Tortugas", "Channel Islands", "Isle Royale", "Biscayne", "Virgin Islands", "American Samoa", "Kenai Fjords", "Glacier Bay"].includes(p.name), p.name).toBe(true);
  });
  it("has pageviews for every place", () => {
    expect(VIEW_PROBLEMS).toEqual([]);
    expect([...US_PLACES.values()].map(p => p.wiki).filter(t => !(t in VIEWS))).toEqual([]);
  });
});

describe("capitals", () => {
  it("knows where every capital is, inside or near its country", () => {
    for (const c of COUNTRIES) for (const k of c.caps) expect(CAPITAL_LL[k.name], k.name).toBeDefined();
  });
});

for (const [name, pool] of [["USA", US_P], ["capitals", CAP_P]] as const) {
  describe(`${name} prompts`, () => {
    it("has plenty of prompts with unique ids", () => {
      expect(pool.length).toBeGreaterThan(40);
      expect(dupes(pool.map(p => p.id))).toEqual([]);
    });
    it("gives every prompt at least five distinct answers that all resolve", () => {
      for (const p of pool) {
        expect(dupes(p.answers), p.id).toEqual([]);
        expect(answersFor(p).length, p.id).toBeGreaterThanOrEqual(5);
        for (const t of p.trick || []) expect(answersFor(p).some(a => a.label === t || a.country === t), `${p.id} trick ${t}`).toBe(true);
      }
    });
    it("never lets one typed name match two answers", () => {
      for (const p of pool) expect(dupes(answersFor(p).flatMap(a => [...new Set(a.nkeys)])), p.id).toEqual([]);
    });
    it("accepts every answer under its own label", () => {
      const known = name === "USA" ? KNOWN_US : undefined;
      for (const p of pool) for (const a of answersFor(p)) expect(judge(answersFor(p), a.label, known), `${p.id}: ${a.label}`).toMatchObject({ kind: "ok", item: { label: a.label } });
    });
    it("makes the likeliest answer Common or Familiar", () => {
      for (const p of pool) expect(answersFor(p)[0].tier, p.id).toBeLessThanOrEqual(1);
    });
  });
}

describe("USA matching", () => {
  const u = (id: string) => answersFor(prompt(US_P, "usa-" + id));
  it("takes abbreviations, nicknames and park names with or without “National Park”", () => {
    expect(judge(u("states"), "NY", KNOWN_US)).toMatchObject({ kind: "ok", item: { label: "New York" } });
    expect(judge(u("city-1m"), "NYC", KNOWN_US)).toMatchObject({ kind: "ok", item: { label: "New York" } });
    expect(judge(u("city-1m"), "philly", KNOWN_US)).toMatchObject({ kind: "ok", item: { label: "Philadelphia" } });
    expect(judge(u("parks"), "Zion National Park", KNOWN_US)).toMatchObject({ kind: "ok", item: { label: "Zion" } });
    expect(judge(u("parks"), "smokies", KNOWN_US)).toMatchObject({ kind: "ok", item: { label: "Great Smoky Mountains" } });
    expect(judge(u("capitals"), "Saint Paul", KNOWN_US)).toMatchObject({ kind: "ok", item: { label: "St. Paul" } });
  });
  it("tells apart two cities with the same name", () => {
    const largest = u("city-largest");
    expect(largest.some(a => a.label === "Portland, Oregon")).toBe(true);
    expect(judge(largest, "Portland, Maine", KNOWN_US)).toMatchObject({ kind: "ok", item: { label: "Portland, Maine" } });
    expect(judge(largest, "Portland ME", KNOWN_US)).toMatchObject({ kind: "ok", item: { label: "Portland, Maine" } });
    expect(judge(largest, "Portland", KNOWN_US)).toMatchObject({ kind: "ok", item: { label: "Portland, Oregon" } });
  });
  it("says a real US place that doesn't fit is wrong", () => {
    expect(judge(u("pacific"), "Texas", KNOWN_US)).toEqual({ kind: "wrong", name: "Texas" });
    expect(judge(u("pacific"), "Chicago", KNOWN_US)).toEqual({ kind: "wrong", name: "Chicago" });
    expect(judge(u("pacific"), "Georgia", KNOWN_US)).toEqual({ kind: "wrong", name: "Georgia" });
  });
  it("rates famous answers low and obscure ones high", () => {
    const tier = (id: string, n: string) => u(id).find(a => a.label === n)!.tier;
    expect(tier("parks", "Yellowstone")).toBe(0);
    expect(tier("parks", "Kobuk Valley")).toBe(4);
    expect(tier("capitals", "Pierre")).toBeGreaterThanOrEqual(3);
  });
  it("makes borders across the Great Lakes the surprise answer", () => {
    expect(u("border-illinois").find(a => a.label === "Michigan")!.tier).toBe(4);
  });
});

describe("capitals matching", () => {
  it("rewords country prompts", () => {
    expect(prompt(CAP_P, "caps-sea-black").q).toBe("Name the capital of a country on the Black Sea");
    expect(answersFor(prompt(CAP_P, "caps-border-france")).map(a => a.label)).toContain("Brasília");
  });
  it("pins every answer on its capital", () => {
    for (const p of CAP_P) for (const a of answersFor(p)) expect(a.ll, `${p.id}: ${a.label}`).toBeDefined();
  });
});

describe("daily sets for each game", () => {
  it("draws seven prompts from seven categories, different in each game", () => {
    for (let day = 20261125; day < 20261125 + 60; day++) {
      for (const m of MODES) {
        const set = pickSet(seedFor(m, day), m.pool);
        expect(set).toHaveLength(ROUNDS);
        expect(new Set(set.map(p => p.cat)).size, `${m.id} ${day}`).toBe(ROUNDS);
      }
    }
  });
  it("keeps the world game's sets as they were", () => {
    expect(seedFor(MODES[0], 20261124)).toBe(20261124);
  });
  it("names the game in the share line", () => {
    expect(shareText([null], "No. 2", "example.com/#usa", "USA")).toBe("Georilla USA No. 2 🦍 0/700\nTourist\n⬛\nexample.com/#usa");
  });
});

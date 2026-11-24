import { describe, expect, it } from "vitest";
import {
  ALL_NAMES, COUNTRIES, COUNTRY, FEATURES, NEIGHBOURS, P, PLACE_COUNTRY, REGION_SETS, VIEWS, WORLD,
  answersFor, category, countryKeys, judge, norm
} from "../src/data";
import { VIEW_PROBLEMS } from "../src/data/popularity.gen";
import { BANDS, rate } from "../src/data/rarity";

const prompt = (id: string) => {
  const p = P.find(x => x.id === id);
  if (!p) throw new Error(`no prompt ${id}`);
  return p;
};
const dupes = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);

describe("countries", () => {
  it("has the 193 UN members, two observers, Kosovo and Taiwan, once each", () => {
    expect(COUNTRIES).toHaveLength(197);
    expect(dupes(COUNTRIES.map(c => c.name))).toEqual([]);
    expect(dupes(COUNTRIES.map(c => c.iso3))).toEqual([]);
  });
  it("gives every country a continent, a capital and open-data facts", () => {
    for (const c of COUNTRIES) {
      expect(c.cont.length, c.name).toBeGreaterThan(0);
      if (c.name !== "Palestine") expect(c.caps.length, c.name).toBeGreaterThan(0);
      const w = WORLD[c.name];
      expect(w, c.name).toBeDefined();
      expect(w.pop, c.name).toBeGreaterThan(0);
      expect(w.area, c.name).toBeGreaterThan(0);
    }
  });
  it("has capital names that point to one country each", () => {
    expect(dupes(COUNTRIES.flatMap(c => c.caps.map(k => k.name)))).toEqual([]);
  });
  it("has symmetric land borders", () => {
    for (const [a, list] of Object.entries(NEIGHBOURS)) for (const b of list) expect(NEIGHBOURS[b], `${a} → ${b}`).toContain(a);
  });
  it("only calls a country landlocked if it has neighbours", () => {
    for (const c of COUNTRIES) if (WORLD[c.name].landlocked) expect(NEIGHBOURS[c.name].length, c.name).toBeGreaterThan(0);
  });
  it("never lets one name mean two countries", () => {
    const owner = new Map<string, string>(), clash: string[] = [];
    for (const c of COUNTRIES) for (const k of countryKeys(c)) {
      const n = norm(k), o = owner.get(n);
      if (o && o !== c.name) clash.push(`${k}: ${o} / ${c.name}`);
      owner.set(n, c.name);
    }
    expect(clash).toEqual([]);
  });
});

describe("hand-checked features", () => {
  it("only names real countries, once each", () => {
    for (const f of FEATURES) {
      for (const m of f.members) expect(COUNTRY.has(m), `${f.id}: ${m}`).toBe(true);
      expect(dupes(f.members), f.id).toEqual([]);
      for (const t of f.trick || []) expect(f.members, `${f.id} trick`).toContain(t);
    }
  });
  it("puts no landlocked country on a coast or island list", () => {
    // the Caspian is a lake, so its shores can be landlocked
    for (const f of FEATURES.filter(x => (x.id.startsWith("sea-") && x.id !== "sea-caspian") || x.id.startsWith("island-")))
      for (const m of f.members) expect(WORLD[m].landlocked, `${f.id}: ${m}`).toBe(false);
  });
  it("agrees with the open data where both have an answer", () => {
    const euro = FEATURES.find(f => f.id === "money-euro")!.members;
    for (const c of COUNTRIES) expect(euro.includes(c.name), c.name).toBe(WORLD[c.name].currencies.includes("Euro"));
    const portuguese = FEATURES.find(f => f.id === "lang-portuguese")!.members;
    for (const c of COUNTRIES) expect(portuguese.includes(c.name), c.name).toBe(WORLD[c.name].languages.includes("Portuguese"));
  });
});

describe("regions", () => {
  it("has complete lists", () => {
    const sizes = Object.fromEntries(Object.entries(REGION_SETS).map(([k, v]) => [k, v.length]));
    expect(sizes).toEqual({ "United States": 50, "Canada": 13, "Australia": 8, "Germany": 16, "India": 28, "Brazil": 27, "Mexico": 32 });
    for (const list of Object.values(REGION_SETS)) expect(dupes(list.map(r => r.name))).toEqual([]);
  });
});

describe("prompts", () => {
  it("has well over a hundred prompts with unique ids", () => {
    expect(P.length).toBeGreaterThan(150);
    expect(dupes(P.map(p => p.id))).toEqual([]);
  });
  it("gives every prompt at least five distinct answers that all resolve", () => {
    for (const p of P) {
      expect(dupes(p.answers), p.id).toEqual([]);
      const items = answersFor(p);
      expect(items.length, p.id).toBeGreaterThanOrEqual(5);
      expect(category(p)).toBeTruthy();
      for (const t of p.trick || []) expect(p.answers, `${p.id} trick`).toContain(t);
    }
  });
  it("never lets one typed name match two answers in a prompt", () => {
    for (const p of P) expect(dupes(answersFor(p).flatMap(a => [...new Set(a.nkeys)])), p.id).toEqual([]);
  });
  it("accepts every answer under its own label", () => {
    for (const p of P) for (const a of answersFor(p)) expect(judge(answersFor(p), a.label), `${p.id}: ${a.label}`).toMatchObject({ kind: "ok", item: { label: a.label } });
  });
  it("judges wordplay on English names only", () => {
    expect(judge(answersFor(prompt("letter-T")), "Timor-Leste")).toMatchObject({ kind: "ok" });
    expect(judge(answersFor(prompt("letter-T")), "East Timor").kind).toBe("wrong");
    expect(judge(answersFor(prompt("end-land")), "Holland").kind).toBe("wrong");
  });
});

describe("popularity data", () => {
  it("has pageviews for every place", () => {
    expect(VIEW_PROBLEMS).toEqual([]);
    const titles = [...COUNTRIES.flatMap(c => [c.wiki, ...c.caps.map(k => k.wiki)]), ...Object.values(REGION_SETS).flat().map(r => r.wiki)];
    expect(titles.filter(t => !(t in VIEWS))).toEqual([]);
  });
});

describe("rarity", () => {
  it("splits predicted guesses into bands", () => {
    expect(rate([50, 25, 15, 7, 3]).map(r => r.tier)).toEqual([0, 1, 2, 3, 4]);
    expect(rate([1, 1, 1]).map(r => r.tier)).toEqual([1, 1, 1]);
    expect(rate([90, 8, 5], [false, false, true]).map(r => r.tier)).toEqual([0, 3, 4]);
    expect(rate([3, 1]).reduce((s, r) => s + r.share, 0)).toBeCloseTo(1);
    expect(BANDS.length).toBe(4);
  });
  it("makes the likeliest answer Common and never rates a likelier answer rarer", () => {
    for (const p of P) {
      const items = answersFor(p), plain = items.filter(a => !p.trick?.includes(p.kind === "country" ? a.country! : a.label));
      expect(items[0].tier, p.id).toBeLessThanOrEqual(1);
      for (let i = 1; i < plain.length; i++) expect(plain[i].tier, `${p.id}: ${plain[i].label}`).toBeGreaterThanOrEqual(plain[i - 1].tier);
    }
  });
  it("puts famous answers low and obscure ones high", () => {
    const tierOf = (id: string, n: string) => answersFor(prompt(id)).find(i => i.label === n)!.tier;
    expect(tierOf("cont-EU", "France")).toBe(0);
    expect(tierOf("cont-EU", "Liechtenstein")).toBe(4);
    expect(tierOf("sea-mediterranean", "Italy")).toBeLessThanOrEqual(1);
    expect(tierOf("cap-EU", "Paris")).toBe(0);
    expect(tierOf("cap-EU", "Chișinău")).toBe(4);
    expect(tierOf("us-states", "California")).toBe(0);
    expect(tierOf("us-states", "North Dakota")).toBeGreaterThanOrEqual(3);
  });
  it("applies trick answers", () => {
    expect(answersFor(prompt("border-france")).find(i => i.label === "Brazil")!.tier).toBe(4);
  });
});

describe("judge", () => {
  const med = answersFor(prompt("sea-mediterranean"));
  it("accepts right answers, aliases, native names and odd spellings", () => {
    expect(judge(med, "  slovenia ").kind).toBe("ok");
    expect(judge(answersFor(prompt("cont-NA")), "USA")).toMatchObject({ kind: "ok", item: { label: "United States" } });
    expect(judge(answersFor(prompt("cont-AF")), "cote d'ivoire")).toMatchObject({ kind: "ok", item: { label: "Ivory Coast" } });
    expect(judge(answersFor(prompt("island-caribbean")), "St Kitts")).toMatchObject({ kind: "ok" });
    expect(judge(answersFor(prompt("cap-EU")), "Kiev")).toMatchObject({ kind: "ok", item: { label: "Kyiv" } });
    expect(judge(answersFor(prompt("cont-EU")), "Deutschland")).toMatchObject({ kind: "ok", item: { label: "Germany" } });
    expect(judge(answersFor(prompt("us-states")), "Georgia")).toMatchObject({ kind: "ok", item: { label: "Georgia" } });
    expect(judge(answersFor(prompt("cont-AS")), "Georgia")).toMatchObject({ kind: "ok", item: { country: "Georgia" } });
  });
  it("says a real place that doesn't fit is wrong", () => {
    expect(judge(med, "Kenya")).toEqual({ kind: "wrong", name: "Kenya" });
    expect(judge(med, "Ohio")).toEqual({ kind: "wrong", name: "Ohio" });
  });
  it("offers a correction for a clear typo instead of accepting it", () => {
    expect(judge(med, "Slovena")).toMatchObject({ kind: "typo", name: "Slovenia" });
  });
  it("handles empty and nonsense input", () => {
    expect(judge(med, "   ").kind).toBe("empty");
    expect(judge(med, "xyzzy").kind).toBe("unknown");
  });
});

describe("helpers", () => {
  it("normalises names", () => {
    expect(norm("São Tomé")).toBe("sao tome");
    expect(norm("The Gambia")).toBe("gambia");
    expect(norm("St. Lucia")).toBe("saint lucia");
  });
  it("maps capitals and states to their country", () => {
    expect(PLACE_COUNTRY["Canberra"]).toBe("Australia");
    expect(PLACE_COUNTRY["Ontario"]).toBe("Canada");
    expect(PLACE_COUNTRY["Bavaria"]).toBe("Germany");
  });
  it("lists every country in the type-ahead", () => {
    const names = new Set(ALL_NAMES.map(n => n.n));
    for (const c of COUNTRIES) expect(names.has(c.name), c.name).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { ALL_NAMES, BORDERS, COUNTRIES, P, PLACE_COUNTRY, answersFor, category, judge, norm } from "../src/data";

const prompt = (id: string) => {
  const p = P.find(x => x.id === id);
  if (!p) throw new Error(`no prompt ${id}`);
  return p;
};

describe("country data", () => {
  it("parses every row with a continent, capital and fame", () => {
    expect(COUNTRIES.length).toBeGreaterThan(190);
    for (const c of COUNTRIES) {
      expect(c.cont.length, c.name).toBeGreaterThan(0);
      expect(c.caps[0], c.name).toBeTruthy();
      expect(c.fame, c.name).toBeGreaterThanOrEqual(1);
      expect(c.fame, c.name).toBeLessThanOrEqual(5);
    }
  });
  it("has unique country names", () => {
    expect(new Set(COUNTRIES.map(c => c.name)).size).toBe(COUNTRIES.length);
  });
  it("only lists real countries in borders", () => {
    const names = new Set(COUNTRIES.map(c => c.name));
    for (const [k, list] of Object.entries(BORDERS)) {
      expect(names.has(k), k).toBe(true);
      for (const n of list) expect(names.has(n), `${k} → ${n}`).toBe(true);
    }
  });
  it("gives every prompt at least five answers and a category", () => {
    for (const p of P) {
      expect(answersFor(p).length, p.id).toBeGreaterThanOrEqual(5);
      expect(category(p)).toBeTruthy();
    }
  });
});

describe("tiers", () => {
  it("puts famous answers low and obscure ones high", () => {
    const items = answersFor(prompt("M"));
    const tierOf = (n: string) => items.find(i => i.label === n)!.tier;
    expect(tierOf("France")).toBe(0);
    expect(tierOf("Slovenia")).toBe(4);
  });
  it("gives equally famous answers the same tier", () => {
    const items = answersFor(prompt("cont-EU"));
    const byFame = new Map<number, Set<number>>();
    items.forEach(i => byFame.set(i.fame, (byFame.get(i.fame) || new Set()).add(i.tier)));
    for (const tiers of byFame.values()) expect(tiers.size).toBe(1);
  });
  it("applies hand-set boosts", () => {
    const items = answersFor(prompt("border-France"));
    expect(items.find(i => i.label === "Brazil")!.tier).toBe(4);
  });
});

describe("judge", () => {
  const med = answersFor(prompt("M"));
  it("accepts right answers, aliases and odd spellings", () => {
    expect(judge(med, "  slovenia ").kind).toBe("ok");
    expect(judge(answersFor(prompt("cont-NA")), "USA")).toMatchObject({ kind: "ok", item: { label: "United States" } });
    expect(judge(answersFor(prompt("cont-AF")), "cote d'ivoire")).toMatchObject({ kind: "ok", item: { label: "Ivory Coast" } });
    expect(judge(answersFor(prompt("C")), "St Kitts")).toMatchObject({ kind: "ok" });
    expect(judge(answersFor(prompt("cap-EU")), "Kiev")).toMatchObject({ kind: "ok", item: { label: "Kyiv" } });
  });
  it("says a real place that doesn't fit is wrong", () => {
    expect(judge(med, "Kenya")).toEqual({ kind: "wrong", name: "Kenya" });
  });
  it("offers a correction for a clear typo instead of accepting it", () => {
    expect(judge(med, "Slovena")).toMatchObject({ kind: "typo", name: "Slovenia" });
  });
  it("refuses to guess when a typo is close to two names", () => {
    expect(judge(answersFor(prompt("cont-EU")), "austrlia").kind).toBe("unknown");
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
  });
  it("lists every country in the type-ahead", () => {
    const names = new Set(ALL_NAMES.map(n => n.n));
    for (const c of COUNTRIES) expect(names.has(c.name), c.name).toBe(true);
  });
});

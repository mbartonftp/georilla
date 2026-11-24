import { describe, expect, it } from "vitest";
import { MAX, ROUNDS, dayKey, dayNumber, pickSet, rankFor, shareText, totalOf } from "../src/rules";

describe("daily set", () => {
  it("is the same for the same day and different on another day", () => {
    const a = pickSet(20261124).map(p => p.id), b = pickSet(20261124).map(p => p.id), c = pickSet(20261125).map(p => p.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
  it("has seven prompts from seven different categories", () => {
    for (let seed = 20261124; seed < 20261124 + 60; seed++) {
      const set = pickSet(seed);
      expect(set).toHaveLength(ROUNDS);
      expect(new Set(set.map(p => p.cat)).size, set.map(p => p.id).join(",")).toBe(ROUNDS);
    }
  });
  it("gives every category a fair turn over a year", () => {
    const seen = new Map<string, number>();
    for (let seed = 20270101; seed < 20270101 + 365; seed++) for (const p of pickSet(seed)) seen.set(p.cat, (seen.get(p.cat) || 0) + 1);
    const counts = [...seen.values()];
    expect(Math.min(...counts) / Math.max(...counts)).toBeGreaterThan(0.6);
  });
  it("numbers days from 24 November 2026", () => {
    expect(dayNumber(new Date(2026, 10, 24, 9))).toBe(1);
    expect(dayNumber(new Date(2026, 10, 25, 23, 59))).toBe(2);
    expect(dayNumber(new Date(2027, 0, 1))).toBe(39);
    expect(dayKey(new Date(2026, 10, 24))).toBe(20261124);
  });
});

describe("scoring", () => {
  const results = [
    { label: "Slovenia", tier: 4, country: "Slovenia" }, null,
    { label: "France", tier: 0, country: "France" }, { label: "Malta", tier: 3, country: "Malta" }
  ];
  it("adds up points", () => {
    expect(totalOf(results)).toBe(180);
    expect(MAX).toBe(700);
  });
  it("ranks totals", () => {
    expect(rankFor(0)).toBe("Tourist");
    expect(rankFor(450)).toBe("Cartographer");
    expect(rankFor(700)).toBe("King of the Jungle");
  });
  it("builds the share line", () => {
    expect(shareText(results, "No. 1", "example.com")).toBe("Georilla No. 1 🦍 180/700\nTrekker\n🟨⬛⬜🟪\nexample.com");
  });
});

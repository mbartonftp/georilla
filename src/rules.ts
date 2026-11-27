/* Pure game rules: daily seeding, scoring, ranks and the share line. No DOM here, so it's easy to test. */
import { P, type Prompt } from "./data";

export const TIERS: readonly (readonly [name: string, points: number])[] =
  [["Common", 10], ["Familiar", 25], ["Uncommon", 45], ["Rare", 70], ["Silverback", 100]];
export const ROUNDS = 7;
export const SECONDS = 30;
export const MAX = ROUNDS * 100;
/** Expedition No. 1 */
export const EPOCH = Date.UTC(2026, 10, 24);
export const EMOJI = ["⬜", "🟦", "🟩", "🟪", "🟨"] as const;
export const MISS = "⬛";
const RANKS: [min: number, name: string][] = [[0, "Tourist"], [150, "Trekker"], [300, "Explorer"], [450, "Cartographer"], [600, "King of the Jungle"]];

export interface Result { label: string; tier: number; country: string | null; ll?: [number, number] }

export function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Local calendar date as a number like 20261124, used as the day's seed. */
export const dayKey = (d: Date): number => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
/** Expedition number for a local date; 24 Nov 2026 is No. 1. */
export const dayNumber = (d: Date): number => Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 864e5) + 1;

const seeded = (seed: number) => {
  const rnd = mulberry32(seed * 2654435761 % 4294967296);
  const shuffle = <T>(a: T[]): T[] => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  return { rnd, shuffle };
};
const byCategory = (pool: Prompt[]) => {
  const byCat = new Map<string, Prompt[]>();
  for (const p of pool) byCat.set(p.cat, [...(byCat.get(p.cat) || []), p]);
  return byCat;
};

/** The original picker, kept so days before NO_OVERLAP_FROM keep the sets people played.
    Seven different categories, each picked evenly, then a prompt within each. */
export function pickSetV1(seed: number, pool: Prompt[] = P): Prompt[] {
  const { rnd, shuffle } = seeded(seed), byCat = byCategory(pool);
  const cats = shuffle([...byCat.keys()].sort());
  return cats.slice(0, ROUNDS).map(c => { const list = byCat.get(c)!; return list[Math.floor(rnd() * list.length)]; });
}

/** One key per answer that means the same place in every game: Ohio is "state:Ohio" whether the world game
    or the USA game asks for it, so two prompts that both take Ohio are seen to overlap. */
export function answerKeys(p: Prompt): string[] {
  if (p.kind === "place") return p.answers;
  if (p.kind === "region") return p.answers.map(a => (p.parent === "United States" ? "state:" + a : `region:${p.parent}:${a}`));
  return p.answers.map(a => `${p.kind}:${a}`);
}

/** What a set must not repeat: answers already used today (keys from answerKeys) and prompts it must skip (ids). */
export interface Avoid { keys?: Iterable<string>; ids?: Iterable<string> }
/** How many draws to try for a set where no answer fits two prompts, before settling for the one with the fewest clashes. */
const TRIES = 20;

/** Seven prompts for a seed, from seven different categories, where no single answer fits two of them
    (no La Paz for both "a country with two capitals" and "South America").
    Categories come in a random order, and each takes a random prompt that shares no answer with the ones already
    picked; a category with none sits the day out. If that leaves fewer than seven, the rest are the prompts that clash
    least. Up to TRIES draws are made, and the first with no clash at all wins. */
export function pickSet(seed: number, pool: Prompt[] = P, avoid: Avoid = {}): Prompt[] {
  const { rnd, shuffle } = seeded(seed), skip = new Set(avoid.ids), before = new Set(avoid.keys);
  const byCat = byCategory(pool.filter(p => !skip.has(p.id)));
  const keys = new Map(pool.map(p => [p, answerKeys(p)]));
  const shares = (a: Prompt, b: Prompt) => { const k = new Set(keys.get(a)); return keys.get(b)!.some(x => k.has(x)); };
  const sharesBefore = (p: Prompt) => keys.get(p)!.some(k => before.has(k));
  /** clashing pairs within the set, plus prompts reusing an answer from earlier today */
  const clashes = (set: Prompt[]) => set.reduce((n, p, i) => n + (sharesBefore(p) ? 1 : 0) + set.slice(i + 1).filter(q => shares(p, q)).length, 0);
  const draw = (): Prompt[] => {
    const cats = shuffle([...byCat.keys()].sort()), taken = new Set(before), out: Prompt[] = [];
    const hits = (p: Prompt) => keys.get(p)!.filter(k => taken.has(k)).length;
    const take = (p: Prompt) => { out.push(p); keys.get(p)!.forEach(k => taken.add(k)); };
    for (const c of cats) {
      if (out.length === ROUNDS) break;
      const clean = byCat.get(c)!.filter(p => !hits(p));
      if (clean.length) take(clean[Math.floor(rnd() * clean.length)]);
    }
    while (out.length < ROUNDS) {
      const used = new Set<string>(out.map(p => p.cat));
      let best: Prompt[] = [], low = Infinity;
      for (const c of cats) if (!used.has(c)) for (const p of byCat.get(c)!) {
        const score = (out.filter(q => shares(p, q)).length + (sharesBefore(p) ? 1 : 0)) * 1e4 + hits(p);
        if (score < low) { low = score; best = [p]; } else if (score === low) best.push(p);
      }
      if (!best.length) break;
      take(best[Math.floor(rnd() * best.length)]);
    }
    return out;
  };
  let best = draw(), low = clashes(best);
  for (let t = 1; t < TRIES && low > 0; t++) { const set = draw(), n = clashes(set); if (n < low) { best = set; low = n; } }
  return best;
}

export const points = (r: Result | null): number => (r ? TIERS[r.tier][1] : 0);
export const totalOf = (results: (Result | null)[]): number => results.reduce((s, r) => s + points(r), 0);
export const rankFor = (score: number): string => RANKS.filter(([min]) => score >= min).pop()![1];

/** The share line. `game` names a side game ("USA", "Capitals"); the main game has none. */
export function shareText(results: (Result | null)[], label: string, site: string, game = ""): string {
  const tot = totalOf(results);
  return `Georilla ${game ? game + " " : ""}${label} 🦍 ${tot}/${MAX}\n${rankFor(tot)}\n` + results.map(r => (r ? EMOJI[r.tier] : MISS)).join("") + `\n${site}`;
}

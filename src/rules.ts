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

/** Seven prompts for a seed: seven different categories, each picked evenly, then a prompt within each.
    Picking the category first keeps big categories (there are dozens of border prompts) from crowding out the rest. */
export function pickSet(seed: number, pool: Prompt[] = P): Prompt[] {
  const rnd = mulberry32(seed * 2654435761 % 4294967296);
  const shuffle = <T>(a: T[]): T[] => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const byCat = new Map<string, Prompt[]>();
  for (const p of pool) byCat.set(p.cat, [...(byCat.get(p.cat) || []), p]);
  const cats = shuffle([...byCat.keys()].sort());
  const out = cats.slice(0, ROUNDS).map(c => { const list = byCat.get(c)!; return list[Math.floor(rnd() * list.length)]; });
  return out;
}

export const points = (r: Result | null): number => (r ? TIERS[r.tier][1] : 0);
export const totalOf = (results: (Result | null)[]): number => results.reduce((s, r) => s + points(r), 0);
export const rankFor = (score: number): string => RANKS.filter(([min]) => score >= min).pop()![1];

/** The share line. `game` names a side game ("USA", "Capitals"); the main game has none. */
export function shareText(results: (Result | null)[], label: string, site: string, game = ""): string {
  const tot = totalOf(results);
  return `Georilla ${game ? game + " " : ""}${label} 🦍 ${tot}/${MAX}\n${rankFor(tot)}\n` + results.map(r => (r ? EMOJI[r.tier] : MISS)).join("") + `\n${site}`;
}

export interface DayGame { name: string; emoji: string; results: (Result | null)[] }
/** One share message for every game finished today: a line per game, then the combined score. */
export function comboShareText(games: DayGame[], label: string, site: string): string {
  const tot = games.reduce((s, g) => s + totalOf(g.results), 0);
  const lines = games.map(g => `${g.emoji} ${g.name} ${totalOf(g.results)} ` + g.results.map(r => (r ? EMOJI[r.tier] : MISS)).join(""));
  return `Georilla ${label} 🦍 ${tot}/${MAX * games.length}\n` + lines.join("\n") + `\n${site}`;
}

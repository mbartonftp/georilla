/* Georilla's knowledge base: answers for each prompt, rarity tiers and answer matching. */
import { COUNTRIES, COUNTRY } from "./countries";
import { VIEWS } from "./popularity.gen";
import { wordplayNames } from "./prompts";
import { CITY_STATE_FACTOR, rate, salience } from "./rarity";
import { REGION_SETS } from "./regions";
import type { Answer, Country, Judgement, Prompt } from "./types";
import { WORLD } from "./world.gen";

export * from "./types";
export { ATLAS_NAME, COUNTRIES, COUNTRY } from "./countries";
export { FEATURES } from "./features";
export { CATEGORIES, NEIGHBOURS, P, PROMPT } from "./prompts";
export { REGION_SETS } from "./regions";
export { WORLD } from "./world.gen";
export { VIEWS } from "./popularity.gen";

/** Lower-case, strip accents and punctuation, and even out "St"/"Saint", "the" and "and". */
export const norm = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ʻ|'|’|\./g, "")
  .replace(/[^a-z0-9]+/g, " ").trim().replace(/^the /, "").replace(/^st /, "saint ").replace(/ and /g, " ");

/** Every name a player might type for a country: ours, the common alternatives, and native names from the open data. */
export const countryKeys = (c: Country): string[] => [c.name, ...c.aliases, ...WORLD[c.name].alt];

const CAPITAL_OF = new Map(COUNTRIES.flatMap(c => c.caps.map(k => [k.name, { country: c, cap: k }] as const)));
/** Fallback when a title has no pageview data yet: ranks it with the least-read places. */
const MISSING_VIEWS = 1000;
const views = (wiki: string) => VIEWS[wiki] ?? MISSING_VIEWS;

type Draft = Omit<Answer, "tier" | "share" | "nkeys"> & { weight: number };

function draft(p: Prompt, name: string): Draft {
  if (p.kind === "capital") {
    const hit = CAPITAL_OF.get(name);
    if (!hit) throw new Error(`${p.id}: unknown capital ${name}`);
    const v = views(hit.cap.wiki), weight = salience(v) * (hit.cap.wiki === hit.country.wiki ? CITY_STATE_FACTOR : 1);
    return { label: name, sub: hit.country.name, country: hit.country.name, views: v, weight, keys: [name, ...hit.cap.aliases] };
  }
  if (p.kind === "region") {
    const r = REGION_SETS[p.parent!]?.find(x => x.name === name);
    if (!r) throw new Error(`${p.id}: unknown region ${name}`);
    return { label: name, country: p.parent, views: views(r.wiki), weight: salience(views(r.wiki)), keys: [name, ...r.aliases] };
  }
  const c = COUNTRY.get(name);
  if (!c) throw new Error(`${p.id}: unknown country ${name}`);
  const keys = p.spell ? wordplayNames(c).filter(p.spell) : countryKeys(c);
  return { label: keys[0], country: c.name, views: views(c.wiki), weight: salience(views(c.wiki), WORLD[c.name].pop), keys };
}

const cache = new Map<string, Answer[]>();
/** Every right answer for a prompt, most likely first, each with its predicted share and rarity tier. */
export function answersFor(p: Prompt): Answer[] {
  const hit = cache.get(p.id);
  if (hit) return hit;
  const items = p.answers.map(n => draft(p, n));
  const rated = rate(items.map(i => i.weight), items.map(i => !!p.trick?.includes(i.country && p.kind === "country" ? i.country : i.label)));
  const out = items.map(({ weight: _w, ...it }, i): Answer => ({ ...it, ...rated[i], nkeys: it.keys.map(norm) }))
    .sort((a, b) => b.share - a.share || a.label.localeCompare(b.label));
  cache.set(p.id, out);
  return out;
}

// every known name, to tell "wrong answer" from "not recognised"
const KNOWN = new Map<string, string>();
const know = (k: string, v: string) => { const n = norm(k); if (n && !KNOWN.has(n)) KNOWN.set(n, v); };
COUNTRIES.forEach(c => [c.name, ...c.aliases].forEach(k => know(k, c.name)));
COUNTRIES.forEach(c => c.caps.forEach(k => [k.name, ...k.aliases].forEach(a => know(a, k.name))));
Object.values(REGION_SETS).flat().forEach(r => [r.name, ...r.aliases].forEach(k => know(k, r.name)));
COUNTRIES.forEach(c => WORLD[c.name].alt.forEach(k => know(k, c.name)));

/** Which country a known place sits in, so the globe can point at a wrong answer. */
export const PLACE_COUNTRY: Record<string, string> = {};
COUNTRIES.forEach(c => { PLACE_COUNTRY[c.name] = c.name; c.caps.forEach(k => PLACE_COUNTRY[k.name] ??= c.name); });
Object.entries(REGION_SETS).forEach(([parent, list]) => list.forEach(r => PLACE_COUNTRY[r.name] ??= parent));

export interface NameEntry { n: string; k: string; alts: string[] }
/** Every display name, for the type-ahead list. It lists all places, so it gives nothing away. */
export const ALL_NAMES: NameEntry[] = [...new Set([...COUNTRIES.map(c => c.name), ...COUNTRIES.flatMap(c => c.caps.map(k => k.name)), ...Object.values(REGION_SETS).flat().map(r => r.name)])]
  .map(n => ({ n, k: norm(n), alts: (COUNTRY.get(n)?.aliases || []).map(norm) }));

/** A short label for the kind of prompt, shown as a chip above it. */
export const category = (p: Prompt): string => p.cat;

export function lev(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Check a typed guess against a prompt's answers. */
export function judge(items: Answer[], raw: string): Judgement {
  const g = norm(raw); if (!g) return { kind: "empty" };
  const hit = items.find(it => it.nkeys.includes(g));
  if (hit) return { kind: "ok", item: hit };
  if (KNOWN.has(g)) return { kind: "wrong", name: KNOWN.get(g)! };
  // forgive small typos on longer names, only when the closest real name is unambiguous; the player confirms it
  const tol = g.length >= 10 ? 2 : g.length >= 7 ? 1 : 0;
  if (tol) {
    let best = tol + 1, near = new Set<string>();
    for (const [k, v] of KNOWN) { const d = lev(k, g); if (d < best) { best = d; near = new Set([v]); } else if (d === best) near.add(v); }
    if (best <= tol && near.size === 1) {
      const v = [...near][0], nv = norm(v);
      return { kind: "typo", name: v, item: items.find(it => it.nkeys.includes(nv) || it.label === v || it.sub === v) || null };
    }
  }
  return { kind: "unknown" };
}

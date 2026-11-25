/* Georilla's knowledge base: answers for each prompt, rarity tiers and answer matching. */
import { COUNTRIES, COUNTRY } from "./countries";
import { VIEWS } from "./popularity.gen";
import { wordplayNames } from "./prompts";
import { CITY_STATE_FACTOR, rate, salience } from "./rarity";
import { REGION_SETS } from "./regions";
import { CAPITAL_LL } from "./capitals.gen";
import type { Answer, Country, Judgement, LonLat, Prompt } from "./types";
import { US_PLACES } from "./usprompts";
import { WORLD } from "./world.gen";

export * from "./types";
export { ATLAS_NAME, COUNTRIES, COUNTRY } from "./countries";
export { FEATURES } from "./features";
export { CATEGORIES, NEIGHBOURS, P, PROMPT } from "./prompts";
export { REGION_SETS } from "./regions";
export { WORLD } from "./world.gen";
export { VIEWS } from "./popularity.gen";
export { CAPITAL_LL } from "./capitals.gen";
export { US_P, US_PLACES } from "./usprompts";
export { CAP_P } from "./capprompts";

/** Lower-case, strip accents and punctuation, and even out "St"/"Saint", "the" and "and". */
export const norm = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ʻ|'|’|\./g, "")
  .replace(/[^a-z0-9]+/g, " ").trim().replace(/^the /, "").replace(/^st /, "saint ").replace(/ and /g, " ");

/** Every name a player might type for a country: ours, the common alternatives, and native names from the open data. */
export const countryKeys = (c: Country): string[] => [c.name, ...c.aliases, ...WORLD[c.name].alt];

const CAPITAL_ALIASES_OF = new Map(COUNTRIES.flatMap(c => c.caps.map(k => [k.name, k.aliases] as const)));
const CAPITAL_OF = new Map(COUNTRIES.flatMap(c => c.caps.map(k => [k.name, { country: c, cap: k }] as const)));
/** Fallback when a title has no pageview data yet: ranks it with the least-read places. */
const MISSING_VIEWS = 1000;
const views = (wiki: string) => VIEWS[wiki] ?? MISSING_VIEWS;

type Draft = Omit<Answer, "tier" | "share" | "nkeys"> & { weight: number; qual?: string };

function draft(p: Prompt, name: string): Draft {
  if (p.kind === "capital") {
    const hit = CAPITAL_OF.get(name);
    if (!hit) throw new Error(`${p.id}: unknown capital ${name}`);
    const v = views(hit.cap.wiki), weight = salience(v) * (hit.cap.wiki === hit.country.wiki ? CITY_STATE_FACTOR : 1);
    return { label: name, sub: hit.country.name, country: hit.country.name, ll: CAPITAL_LL[name], views: v, weight, keys: [name, ...hit.cap.aliases] };
  }
  if (p.kind === "place") {
    const pl = US_PLACES.get(name);
    if (!pl) throw new Error(`${p.id}: unknown place ${name}`);
    const v = views(pl.wiki);
    return { label: pl.name, country: pl.area, ll: pl.ll, qual: pl.qual, views: v, weight: salience(v, pl.pop), keys: [...pl.keys] };
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
  // two answers with the same name (Portland, Oregon and Portland, Maine): show which is which, and let the bare name mean the likelier one
  const byLabel = new Map<string, Draft[]>();
  for (const it of items) byLabel.set(it.label, [...(byLabel.get(it.label) || []), it]);
  for (const [label, group] of byLabel) {
    if (group.length < 2) continue;
    group.sort((a, b) => b.weight - a.weight);
    group.forEach((it, i) => { it.label = `${label}, ${it.qual}`; if (i > 0) it.keys = it.keys.filter(k => norm(k) !== norm(label)); });
  }
  const rated = rate(items.map(i => i.weight), items.map(i => !!p.trick?.includes(i.country && p.kind === "country" ? i.country : i.label)));
  const out = items.map(({ weight: _w, qual: _q, ...it }, i): Answer => ({ ...it, ...rated[i], nkeys: it.keys.map(norm) }))
    .sort((a, b) => b.share - a.share || a.label.localeCompare(b.label));
  cache.set(p.id, out);
  return out;
}

/** Every known name, to tell "wrong answer" from "not recognised". Each game knows its own places first. */
export type Known = Map<string, string>;
const knowWorld = (known: Known) => {
  const know = (k: string, v: string) => { const n = norm(k); if (n && !known.has(n)) known.set(n, v); };
  COUNTRIES.forEach(c => [c.name, ...c.aliases].forEach(k => know(k, c.name)));
  COUNTRIES.forEach(c => c.caps.forEach(k => [k.name, ...k.aliases].forEach(a => know(a, k.name))));
  Object.values(REGION_SETS).flat().forEach(r => [r.name, ...r.aliases].forEach(k => know(k, r.name)));
  COUNTRIES.forEach(c => WORLD[c.name].alt.forEach(k => know(k, c.name)));
  return known;
};
const KNOWN: Known = knowWorld(new Map());
/** The USA game: US places first, keyed to their place id's display name, then the rest of the world. */
export const KNOWN_US: Known = (() => {
  const known: Known = new Map();
  // bigger cities first, so "Portland" means Portland, Oregon
  const places = [...US_PLACES.values()].sort((a, b) => (b.pop || 0) - (a.pop || 0));
  for (const pl of places) for (const k of pl.keys) { const n = norm(k); if (n && !known.has(n)) known.set(n, pl.name); }
  return knowWorld(known);
})();

/** Where a known US place is, so the US map can point at a wrong answer. */
export const PLACE_US: Record<string, { area: string; ll?: LonLat }> = {};
[...US_PLACES.values()].sort((a, b) => (b.pop || 0) - (a.pop || 0)).forEach(pl => { PLACE_US[pl.name] ??= { area: pl.area, ll: pl.ll }; });

/** Which country a known place sits in, so the globe can point at a wrong answer. */
export const PLACE_COUNTRY: Record<string, string> = {};
COUNTRIES.forEach(c => { PLACE_COUNTRY[c.name] = c.name; c.caps.forEach(k => PLACE_COUNTRY[k.name] ??= c.name); });
Object.entries(REGION_SETS).forEach(([parent, list]) => list.forEach(r => PLACE_COUNTRY[r.name] ??= parent));

export interface NameEntry { n: string; k: string; alts: string[] }
const entries = (names: string[], alts: (n: string) => string[] = () => []): NameEntry[] =>
  [...new Set(names)].map(n => ({ n, k: norm(n), alts: alts(n).map(norm) }));
/** Every display name, for the type-ahead list. It lists all places, so it gives nothing away. */
export const ALL_NAMES: NameEntry[] = entries([...COUNTRIES.map(c => c.name), ...COUNTRIES.flatMap(c => c.caps.map(k => k.name)), ...Object.values(REGION_SETS).flat().map(r => r.name)],
  n => COUNTRY.get(n)?.aliases || []);
/** The capitals game lists only capitals. */
export const CAPITAL_NAMES: NameEntry[] = entries(COUNTRIES.flatMap(c => c.caps.map(k => k.name)), n => CAPITAL_ALIASES_OF.get(n) || []);
/** The USA game lists states, cities and parks. Cities that share a name are listed once. */
export const US_NAMES: NameEntry[] = entries([...US_PLACES.values()].sort((a, b) => (b.pop || 0) - (a.pop || 0)).map(p => p.name));

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
export function judge(items: Answer[], raw: string, known: Known = KNOWN): Judgement {
  const g = norm(raw); if (!g) return { kind: "empty" };
  const hit = items.find(it => it.nkeys.includes(g));
  if (hit) return { kind: "ok", item: hit };
  if (known.has(g)) return { kind: "wrong", name: known.get(g)! };
  // forgive small typos on longer names, only when the closest real name is unambiguous; the player confirms it
  const tol = g.length >= 10 ? 2 : g.length >= 7 ? 1 : 0;
  if (tol) {
    let best = tol + 1, near = new Set<string>();
    for (const [k, v] of known) { const d = lev(k, g); if (d < best) { best = d; near = new Set([v]); } else if (d === best) near.add(v); }
    if (best <= tol && near.size === 1) {
      const v = [...near][0], nv = norm(v);
      return { kind: "typo", name: v, item: items.find(it => it.nkeys.includes(nv) || it.label === v || it.sub === v) || null };
    }
  }
  return { kind: "unknown" };
}

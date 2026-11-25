/* Regenerates src/data/wordfreq.gen.ts: how often each country, capital, state and province is written in everyday
   English, as a Zipf value (6 = once per thousand words, 3 = once per million), from the wordfreq dataset
   (https://github.com/rspeer/wordfreq, data CC BY-SA 4.0), which pools Wikipedia, subtitles, news, books, the web,
   Twitter and Reddit. Names where the measure can't be trusted are left out; see src/data/familiarity.ts.
   Run with: npm run data:wordfreq */
import { writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { decode } from "@msgpack/msgpack";
import { COUNTRIES } from "../src/data/countries";
import { ALSO_WRITTEN, GENERIC_WORDS, NOT_A_PLACE_WORD } from "../src/data/familiarity";
import { REGION_SETS } from "../src/data/regions";

const VERSION = "v3.2";
const URL_ = `https://raw.githubusercontent.com/rspeer/wordfreq/${VERSION}/wordfreq/data/large_en.msgpack.gz`;
/** wordfreq lists words down to about Zipf 1; a name that isn't listed is rarer still. */
const FLOOR = 1;
/** Zipf cost of each word past two in another name for a country. */
const LONG_NAME = 0.6;
/** In a multi-word name, a distinctive word this common is an ordinary word too ("St. John's"), so the phrase can't be scored. */
const COMMON_WORD = 4.8;

const deaccent = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const tokens = (name: string) => name.toLowerCase().replace(/[ʻ’]/g, "'").split(/[^\p{L}]+/u).filter(t => t.length > 1);

async function main() {
  const res = await fetch(URL_);
  if (!res.ok) throw new Error(`${res.status} ${URL_}`);
  // wordfreq's "cB" format: a header, then lists of words; list i holds words with frequency 10^(-i/100)
  const lists = decode(gunzipSync(Buffer.from(await res.arrayBuffer()))) as [unknown, ...string[][]];
  const zipf = new Map<string, number>();
  lists.slice(1).forEach((words, i) => (words as string[]).forEach(w => zipf.set(w, 9 - i / 100)));
  // English text writes accented names both ways (Brasília, Brasilia), so add the two
  const wordZipf = (t: string) => {
    const spellings = [...new Set([t, deaccent(t)])].map(w => zipf.get(w)).filter((z): z is number => z !== undefined);
    return spellings.length ? Math.log10(spellings.reduce((s, z) => s + 10 ** z, 0)) : 0;
  };

  const places: { name: string; wiki: string }[] = [
    ...COUNTRIES.flatMap(c => [{ name: c.name, wiki: c.wiki }, ...c.caps.map(k => ({ name: k.name, wiki: k.wiki }))]),
    ...Object.values(REGION_SETS).flat().map(r => ({ name: r.name, wiki: r.wiki }))
  ];
  // a word that's in two places' names (Carolina, Guinea, Sudan) can't tell them apart
  const owners = new Map<string, Set<string>>();
  for (const p of places) for (const t of tokens(p.name)) if (!GENERIC_WORDS.has(t)) owners.set(t, (owners.get(t) || new Set()).add(p.name));

  /** Zipf of one spelling, or why it can't be scored. */
  const phrase = (name: string): number | string => {
    const all = tokens(name), words = all.filter(t => !GENERIC_WORDS.has(t));
    if (!words.length) return "only generic words";
    if (all.length === 1 || zipf.has(name.toLowerCase())) return wordZipf(name.toLowerCase()) || wordZipf(all[0]) || FLOOR;
    // a multi-word name is about as common as its rarest distinctive word, when that word means little else
    const rarest = words.reduce((a, b) => (wordZipf(a) <= wordZipf(b) ? a : b)), z = wordZipf(rarest);
    if (!z) return FLOOR;
    if ((owners.get(rarest)?.size ?? 0) > 1) return `"${rarest}" is in another place's name`;
    if (z >= COMMON_WORD) return `"${rarest}" is an everyday word`;
    return z;
  };

  // Djibouti, the country and the city: one name's frequency can't be split between two places
  const sameName = new Map<string, Set<string>>();
  for (const p of places) sameName.set(p.name, (sameName.get(p.name) || new Set()).add(p.wiki));

  const out: Record<string, number> = {}, skipped: Record<string, string> = {};
  for (const p of places) {
    if (p.wiki in out || p.wiki in skipped) continue;
    if (NOT_A_PLACE_WORD.has(p.name)) { skipped[p.wiki] = "name mostly means something else"; continue; }
    if (sameName.get(p.name)!.size > 1) { skipped[p.wiki] = "another place has the same name"; continue; }
    const main = phrase(p.name);
    if (typeof main === "string") { skipped[p.wiki] = main; continue; }
    // add the frequencies of other spellings people write
    const extra = (ALSO_WRITTEN.get(p.name) || []).map(phrase).filter((z): z is number => typeof z === "number");
    out[p.wiki] = Math.round(Math.log10([main, ...extra].reduce((s, z) => s + 10 ** z, 0)) * 100) / 100;
  }
  // other names for countries, for wordplay prompts where only the other name fits ("Burma" for B): how often that
  // spelling itself is written, as the rarest distinctive word in it. Long official names ("Republic of the Congo")
  // are written far less than their words, so each word past two costs LONG_NAME.
  const aliasZipf: Record<string, number> = {};
  for (const c of COUNTRIES) for (const a of c.aliases) {
    const all = tokens(a), words = all.filter(t => !GENERIC_WORDS.has(t));
    const z = wordZipf(a.toLowerCase()) || Math.min(...(words.length ? words : all).map(t => wordZipf(t) || FLOOR)) - LONG_NAME * Math.max(0, all.length - 2);
    aliasZipf[a] = Math.round(Math.max(FLOOR, z) * 100) / 100;
  }
  const lines = (o: Record<string, unknown>) => Object.entries(o).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(",\n");
  writeFileSync(new URL("../src/data/wordfreq.gen.ts", import.meta.url),
    `/* Generated by scripts/fetch-wordfreq.ts. Do not edit by hand.
   How often each name is written in English, as a Zipf value (log10 of uses per billion words), from wordfreq ${VERSION}
   (https://github.com/rspeer/wordfreq) by Robyn Speer, data licensed CC BY-SA 4.0. */

/** Zipf frequency by Wikipedia title. */
export const WORD_ZIPF: Record<string, number> = {
${lines(out)}
};

/** Other names for countries, by name, for wordplay answers that only fit under that name. */
export const ALIAS_ZIPF: Record<string, number> = {
${lines(aliasZipf)}
};

/** Places left out, and why: their rarity uses pageviews alone. */
export const WORD_SKIPPED: Record<string, string> = {
${lines(skipped)}
};
`);
  console.log(`${Object.keys(out).length} scored, ${Object.keys(skipped).length} skipped`);
  for (const [k, v] of Object.entries(skipped)) console.log(`  ${k}: ${v}`);
}

void main();

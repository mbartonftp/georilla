/* Every prompt Georilla can ask, built from the country facts, the hand-checked features and the region lists. */
import { COUNTRIES, COUNTRY } from "./countries";
import { FEATURES, OVERSEAS_BORDERS } from "./features";
import { AUSTRALIA, BRAZIL, CANADA, GERMANY, INDIA, MEXICO, US_STATES } from "./regions";
import type { Category, ContinentCode, Country, Prompt, Region } from "./types";
import { WORLD } from "./world.gen";

const CONT: Record<ContinentCode, string> = { AF: "Africa", AS: "Asia", EU: "Europe", NA: "North America", SA: "South America", OC: "Oceania" };
/** names that read better with "the" in a sentence */
const THE = new Set(["DR Congo", "United States", "United Kingdom", "Netherlands", "Bahamas", "Gambia", "Philippines", "Central African Republic",
  "Dominican Republic", "United Arab Emirates"]);
export const inSentence = (n: string) => (n === "Congo" ? "the Republic of the Congo" : THE.has(n) ? "the " + n : n);

/** Land neighbours: the open data plus borders through overseas territories. */
export const NEIGHBOURS: Record<string, string[]> = {};
for (const c of COUNTRIES) NEIGHBOURS[c.name] = [...WORLD[c.name].borders];
for (const [a, b] of OVERSEAS_BORDERS) { NEIGHBOURS[a].push(b); NEIGHBOURS[b].push(a); }
const overseas = (k: string) => OVERSEAS_BORDERS.filter(([a, b]) => a === k || b === k).map(([a, b]) => (a === k ? b : a));

const names = (f: (c: Country) => boolean) => COUNTRIES.filter(f).map(c => c.name);
/** the names a player could type for a country, for wordplay prompts (the open data's foreign-language names don't count) */
export const wordplayNames = (c: Country) => [c.name, ...c.aliases.filter(a => !NICKNAMES.has(a))];
/** aliases we accept elsewhere but that would be cheating at wordplay */
const NICKNAMES = new Set(["Holland", "America", "Britain", "Emirates", "Vatican", "Bosnia", "Trinidad", "Antigua", "Saint Kitts", "St Kitts", "Saint Vincent", "Sao Tome"]);
const initial = (s: string) => s.replace(/^the /i, "")[0].toUpperCase();

export const P: Prompt[] = [];
const add = (p: Prompt) => P.push(p);

// Continents
for (const k of ["AF", "AS", "EU", "SA", "OC", "NA"] as ContinentCode[])
  add({ id: "cont-" + k, cat: "Continents", kind: "country", q: `Name a country in ${CONT[k]}`,
    note: k === "NA" ? "Central America and the Caribbean count." : k === "OC" ? "Australia, New Zealand and the Pacific islands." : undefined,
    answers: names(c => c.cont.includes(k)) });

// Capitals
for (const k of ["EU", "AF", "AS", "SA", "NA", "OC"] as ContinentCode[])
  add({ id: "cap-" + k, cat: "Capitals", kind: "capital", q: `Name a capital city in ${CONT[k]}`,
    note: k === "NA" ? "Central America and the Caribbean count." : undefined,
    answers: COUNTRIES.filter(c => c.cont.includes(k)).flatMap(c => c.caps.map(x => x.name)) });
const allCaps = COUNTRIES.flatMap(c => c.caps.map(x => x.name));
for (const letter of [...new Set(allCaps.map(initial))].sort()) {
  const answers = allCaps.filter(n => initial(n) === letter);
  if (answers.length >= 8) add({ id: "capletter-" + letter, cat: "Capitals", kind: "capital", q: `Name a capital city starting with “${letter}”`, answers });
}

// Neighbours: every country with five or more
for (const c of COUNTRIES) {
  const n = NEIGHBOURS[c.name];
  if (n.length < 5) continue;
  const extra = overseas(c.name);
  add({ id: "border-" + c.name.toLowerCase().replace(/[^a-z]+/g, "-"), cat: "Neighbours", kind: "country",
    q: `Name a country that borders ${inSentence(c.name)}`,
    note: extra.length ? "Overseas territories count." : undefined, answers: [...n].sort(), trick: extra.length ? extra : undefined });
}

// Land & islands, size and people
add({ id: "landlocked", cat: "Land & islands", kind: "country", q: "Name a landlocked country", answers: names(c => WORLD[c.name].landlocked) });
add({ id: "no-borders", cat: "Land & islands", kind: "country", q: "Name a country with no land borders", note: "Island nations, mostly.",
  answers: names(c => NEIGHBOURS[c.name].length === 0) });
add({ id: "one-border", cat: "Neighbours", kind: "country", q: "Name a country that borders exactly one other country",
  note: "Borders through overseas territories don't count.", answers: names(c => WORLD[c.name].borders.length === 1) });
const byPop = [...COUNTRIES].sort((a, b) => WORLD[b.name].pop - WORLD[a.name].pop), byArea = [...COUNTRIES].sort((a, b) => WORLD[b.name].area - WORLD[a.name].area);
add({ id: "pop-100m", cat: "Size & people", kind: "country", q: "Name a country with more than 100 million people", note: "World Bank figures.",
  answers: names(c => WORLD[c.name].pop > 1e8) });
add({ id: "pop-top30", cat: "Size & people", kind: "country", q: "Name one of the 30 most populous countries", note: "World Bank figures.",
  answers: byPop.slice(0, 30).map(c => c.name) });
add({ id: "pop-under-1m", cat: "Size & people", kind: "country", q: "Name a country with fewer than a million people", note: "World Bank figures.",
  answers: names(c => WORLD[c.name].pop < 1e6) });
add({ id: "area-top20", cat: "Size & people", kind: "country", q: "Name one of the 20 largest countries by area", answers: byArea.slice(0, 20).map(c => c.name) });
add({ id: "area-under-1000", cat: "Size & people", kind: "country", q: "Name a country smaller than 1,000 km²", note: "About the size of Hong Kong.",
  answers: names(c => WORLD[c.name].area < 1000) });

// Hand-checked features
for (const f of FEATURES) add({ id: f.id, cat: f.cat, kind: "country", q: f.q, note: f.note, answers: f.members, trick: f.trick });

// Wordplay: judged on English names only
const wordplay = (id: string, q: string, test: (name: string) => boolean, note?: string) => {
  const answers = names(c => wordplayNames(c).some(test));
  add({ id, cat: "Wordplay", kind: "country", q, note, answers, spell: test });
};
const letters = [...new Set(COUNTRIES.map(c => initial(c.name)))].sort();
for (const letter of letters) {
  const test = (n: string) => initial(n) === letter;
  if (names(c => wordplayNames(c).some(test)).length >= 6) wordplay("letter-" + letter, `Name a country starting with “${letter}”`, test);
}
wordplay("end-stan", "Name a country ending in “-stan”", n => n.endsWith("stan"));
wordplay("end-land", "Name a country ending in “-land”", n => n.endsWith("land"));
wordplay("end-ia", "Name a country ending in “-ia”", n => n.endsWith("ia"));
wordplay("same-ends", "Name a country that starts and ends with the same letter", n => {
  const s = n.replace(/^the /i, "").toLowerCase().replace(/[^a-z]/g, "");
  return s.length > 1 && s[0] === s[s.length - 1];
}, "Andorra, for example.");

// States & provinces
const regionPrompt = (id: string, parent: string, q: string, list: Region[], pick?: string[], note?: string, trick?: string[]) => {
  const answers = pick || list.map(r => r.name);
  add({ id, cat: "States & provinces", kind: "region", parent, q, note, answers, trick });
};
const S = (s: string) => s.split(",").map(x => x.trim());
regionPrompt("us-states", "United States", "Name a US state", US_STATES);
regionPrompt("us-canada", "United States", "Name a US state that borders Canada", US_STATES,
  S("Alaska, Washington, Idaho, Montana, North Dakota, Minnesota, Michigan, New York, Vermont, New Hampshire, Maine, Ohio, Pennsylvania"),
  "Water borders on the Great Lakes count.", S("Ohio, Pennsylvania"));
regionPrompt("us-pacific", "United States", "Name a US state on the Pacific", US_STATES, S("California, Oregon, Washington, Alaska, Hawaii"));
regionPrompt("us-gulf", "United States", "Name a US state on the Gulf of Mexico", US_STATES, S("Texas, Louisiana, Mississippi, Alabama, Florida"),
  "Also called the Gulf of America in the US.");
regionPrompt("us-atlantic", "United States", "Name a US state on the Atlantic coast", US_STATES,
  S("Maine, New Hampshire, Massachusetts, Rhode Island, Connecticut, New York, New Jersey, Delaware, Maryland, Virginia, North Carolina, South Carolina, Georgia, Florida"),
  "Bays and sounds open to the ocean count.");
regionPrompt("us-mississippi", "United States", "Name a US state the Mississippi River touches", US_STATES,
  S("Minnesota, Wisconsin, Iowa, Illinois, Missouri, Kentucky, Tennessee, Arkansas, Mississippi, Louisiana"));
regionPrompt("us-great-lakes", "United States", "Name a US state on the Great Lakes", US_STATES,
  S("Minnesota, Wisconsin, Illinois, Indiana, Michigan, Ohio, Pennsylvania, New York"));
regionPrompt("us-new-england", "United States", "Name a New England state", US_STATES, S("Maine, New Hampshire, Vermont, Massachusetts, Rhode Island, Connecticut"));
regionPrompt("us-thirteen", "United States", "Name one of the original Thirteen Colonies", US_STATES,
  S("New Hampshire, Massachusetts, Rhode Island, Connecticut, New York, New Jersey, Pennsylvania, Delaware, Maryland, Virginia, North Carolina, South Carolina, Georgia"),
  "As the states they became.");
regionPrompt("canada", "Canada", "Name a Canadian province or territory", CANADA);
regionPrompt("australia", "Australia", "Name an Australian state or territory", AUSTRALIA);
regionPrompt("germany", "Germany", "Name a German state", GERMANY, undefined, "The 16 Länder; the city-states count.");
regionPrompt("india", "India", "Name an Indian state", INDIA, undefined, "The 28 states; union territories like Delhi don't count.");
regionPrompt("brazil", "Brazil", "Name a Brazilian state", BRAZIL, undefined, "The Federal District counts.");
regionPrompt("mexico", "Mexico", "Name a Mexican state", MEXICO, undefined, "Mexico City counts.");

export const PROMPT = new Map(P.map(p => [p.id, p]));
export const CATEGORIES: Category[] = [...new Set(P.map(p => p.cat))];
export { COUNTRY };

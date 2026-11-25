/* The world capitals game: every answer is a capital city. Most prompts reuse a country prompt from the main game
   ("Name a country on the Black Sea" becomes "Name the capital of a country on the Black Sea"). */
import { COUNTRIES, COUNTRY } from "./countries";
import { P } from "./prompts";
import type { Category, ContinentCode, Prompt } from "./types";

const CONT: Record<ContinentCode, string> = { AF: "Africa", AS: "Asia", EU: "Europe", NA: "North America", SA: "South America", OC: "Oceania" };
const capsOf = (countries: string[]) => countries.flatMap(n => COUNTRY.get(n)!.caps.map(k => k.name));

export const CAP_P: Prompt[] = [];
const add = (id: string, cat: Category, q: string, answers: string[], extra: Partial<Prompt> = {}) =>
  CAP_P.push({ id: "caps-" + id, cat, q, kind: "capital", answers, ...extra });

// Continents
for (const k of ["EU", "AF", "AS", "SA", "NA", "OC"] as ContinentCode[])
  add("cont-" + k, "Continents", `Name a capital city in ${CONT[k]}`, capsOf(COUNTRIES.filter(c => c.cont.includes(k)).map(c => c.name)),
    k === "NA" ? { note: "Central America and the Caribbean count." } : {});

// Country prompts from the main game, turned into capital prompts. Wordplay doesn't carry over, and continents are above.
for (const p of P) {
  if (p.kind !== "country" || p.cat === "Wordplay" || p.cat === "Continents") continue;
  const answers = capsOf(p.answers);
  if (answers.length < 5) continue;
  const trick = p.trick && capsOf(p.trick);
  add(p.id, p.cat, p.q.replace(/^Name /, "Name the capital of "), answers, { note: p.note, trick: trick?.length ? trick : undefined });
}

// Wordplay on the capitals' own names
const allCaps = COUNTRIES.flatMap(c => c.caps.map(k => k.name));
const initial = (s: string) => s[0].toUpperCase();
for (const letter of [...new Set(allCaps.map(initial))].sort()) {
  const answers = allCaps.filter(n => initial(n) === letter);
  if (answers.length >= 6) add("letter-" + letter, "Wordplay", `Name a capital city starting with “${letter}”`, answers);
}
const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
add("end-a", "Wordplay", "Name a capital city ending in “a”", allCaps.filter(n => plain(n).endsWith("a")));
add("two-words", "Wordplay", "Name a capital city with a name of two or more words", allCaps.filter(n => /[\s-]/.test(n.replace(/, D\.C\.$/, ""))),
  { note: "Hyphens count as a break." });
add("same-start", "Wordplay", "Name a capital that starts with the same letter as its country",
  COUNTRIES.flatMap(c => c.caps.filter(k => plain(k.name)[0] === plain(c.name.replace(/^The /, ""))[0]).map(k => k.name)));

// Capital trivia
add("named-for-country", "Capital trivia", "Name a capital that has its country's name in it",
  COUNTRIES.flatMap(c => c.caps.filter(k => plain(k.name).includes(plain(c.name))).map(k => k.name)), { note: "Like Mexico City." });
add("not-largest", "Capital trivia", "Name a capital that isn't its country's biggest city",
  ["Washington, D.C.", "Ottawa", "Brasília", "Canberra", "Wellington", "Ankara", "Abuja", "Pretoria", "Cape Town", "Bloemfontein", "Bern",
    "Islamabad", "Naypyidaw", "Astana", "Dodoma", "Yamoussoukro", "Porto-Novo", "Rabat", "Belmopan", "Beijing", "Hanoi", "Manila",
    "Sri Jayawardenepura Kotte", "Gitega", "Malabo", "Sucre", "La Paz", "Vaduz", "Ngerulmud", "Palikir", "Valletta", "New Delhi",
    "Abu Dhabi", "Banjul", "Taipei"],
  { note: "Counting the city proper, not its metro area." });
const multi = COUNTRIES.filter(c => c.caps.length > 1);
add("shared-role", "Capital trivia", "Name a capital of a country with more than one capital", capsOf(multi.map(c => c.name)),
  { note: "Some countries split the job between cities." });
